const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
	name: "scraper",
	actions: {
		async scrapeApkMirrorUploads(ctx) {
			const { url, appName } = ctx.params;
			const browser = await puppeteer.launch({ headless: false });
			const page = await browser.newPage();

			try {
				await page.goto(url);
				await page.waitForSelector('.appRow');
				const $ = cheerio.load(await page.content());
				const appRows = $('.appRow');

				for (const appRow of appRows) {
					const appLink = $(appRow).find('a.fontBlack').attr('href');
					const version = $(appRow).find('h5.appRowTitle').text().trim();
					const releaseDate = $(appRow).find('.dateyear_utc').text().trim();

					try {
						const newPage = await browser.newPage();
						await newPage.goto(`https://www.apkmirror.com${appLink}`);
						await sleep(2000);
						await newPage.waitForSelector('.table-cell');
						const variantLinks = await newPage.$$('.variant-button');
						const variants = [];
						let variantUrl = "";
						for (const variantLink of variantLinks) {
							try {
								variantUrl = await variantLink.evaluate(el => el.href);
								const variantPage = await browser.newPage();
								await variantPage.goto(variantUrl);
								await sleep(2000);
								await variantPage.waitForSelector('.fontWhite noHover');

								const variantHtml = await variantPage.content();
								const $variant = cheerio.load(variantHtml);
								const variantId = $variant('.filename').text().split('-').pop().split('.')[0];
								const architecture = $variant('#architecture span').text().trim();
								const minAndroid = $variant('#minAndroid span').text().trim();
								const dpi = $variant('#dpi span').text().trim();
								const isBeta = variantUrl.toLowerCase().includes('beta');
								const isAlpha = variantUrl.toLowerCase().includes('alpha');

								variants.push({
									variantId,
									architecture,
									minAndroid,
									dpi,
									isBeta,
									isAlpha
								});
								await variantPage.close();

								// Variant verileri çekildiğinde event yayını
								ctx.emit('variant.fetched', {
									appName,
									version,
									releaseDate,
									variant: {
										variantId,
										architecture,
										minAndroid,
										dpi,
										isBeta,
										isAlpha
									}
								});
							} catch (variantError) {
								console.error(`Variant error (URL: ${variantUrl}):`, variantError);
							}
						}

						const apkData = {
							appName,
							version,
							releaseDate,
							variants
						};

						// App verileri çekildiğinde event yayını
						ctx.emit('data.fetched', apkData);

						await newPage.close();
					} catch (appError) {
						console.error(`App error (URL: ${appLink}):`, appError);
					}
				}
			} catch (mainError) {
				console.error('Main page loading or parsing error:', mainError);
			} finally {
				await browser.close();
			}
		}
	}
};
