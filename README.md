 

```markdown
# OXO4Case Projesi

Bu proje, APK Mirror'dan veri çekmek için Moleculer, MongoDB, PostgreSQL ve Redis kullanan bir Node.js uygulamasıdır. Aşağıda projenin kurulumu, çalıştırılması ve kullanımına dair bilgiler bulunmaktadır.

## Gereksinimler

- Node.js
- Docker
- Docker Compose

## Kurulum

1. **Proje Deposu:**

   Proje deposunu klonlayın:
   ```bash
   git clone https://github.com/kullanici/oxo4case.git
   cd oxo4case
 

2. **Docker Kullanarak Veritabanlarını Başlatma:**

   Docker ile PostgreSQL ve Redis konteynerlarını başlatın:
   ```bash
   docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
   docker run --name some-redis -d -p 6379:6379 redis
   ```

3. **.env Dosyasını Oluşturma:**

   Proje kök dizininde bir `.env` dosyası oluşturun ve aşağıdaki içerikleri ekleyin:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/mydatabase
   MONGODB_URI=mongodb://username:password@localhost:27017/mydatabase
   POSTGRES_USER=username
   POSTGRES_HOST=localhost
   POSTGRES_DATABASE=mydatabase
   POSTGRES_PASSWORD=password
   POSTGRES_PORT=5432
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

4. **Prisma Migrate ve Generate:**

   Veritabanı şemasını güncellemek ve Prisma Client'ı oluşturmak için aşağıdaki komutları çalıştırın:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Node.js Bağımlılıklarını Kurma:**

   Proje bağımlılıklarını kurun:
   ```bash
   npm install
   ```

## Projenin Çalıştırılması

Aşağıdaki komut ile projeyi başlatabilirsiniz:
```bash
npm start
```

## Servisler

### db.service.js

Bu servis, MongoDB, PostgreSQL ve Redis bağlantılarını yönetir ve veri tabanı işlemlerini gerçekleştirir.

#### PostgreSQL İşlemleri

- `pgQuery`: PostgreSQL sorgularını çalıştırır.

#### MongoDB İşlemleri

- `mongoFind`: MongoDB'de veri bulur.
- `mongoCreate`: MongoDB'ye veri ekler.
- `mongoUpdate`: MongoDB'deki veriyi günceller.
- `mongoDelete`: MongoDB'deki veriyi siler.

#### Redis İşlemleri

- `redisGet`: Redis'ten veri alır.
- `redisSet`: Redis'e veri ekler.

### api.service.js

Bu servis, APK verilerini yönetir ve farklı veri kaynakları arasındaki etkileşimi sağlar.

#### Aksiyonlar

- `fetchApkData`: Belirtilen URL'den APK verilerini çeker.
- `getVersions`: Belirtilen uygulamanın sürümlerini getirir.
- `getVersionDetails`: Belirtilen sürümün detaylarını getirir.
- `updateVersion`: Belirtilen sürümü günceller.
- `deleteVersion`: Belirtilen sürümü siler.
- `checkCompatibility`: Cihazın APK ile uyumlu olup olmadığını kontrol eder.

#### Olaylar

- `data.fetched`: Veriler alındığında çalışır, verileri MongoDB'ye kaydeder ve PostgreSQL'e ekler.
- `variant.fetched`: APK varyantları alındığında çalışır, varyantları MongoDB'de günceller.

### scraper.service.js

Bu servis, APK Mirror'dan veri çeker.

### Cron İşlemleri

API servisi her 2 dakikada bir APK Mirror'dan veri çekmek için bir cron job çalıştırır.

```javascript
const cron = require('node-cron');

cron.schedule('*/2 * * * *', async () => {
	const apps = [
		{ appName: 'instagram', url: 'https://www.apkmirror.com/uploads/?appcategory=instagram-instagram' },
		{ appName: 'tiktok', url: 'https://www.apkmirror.com/uploads/?appcategory=tiktok' },
		{ appName: 'twitter', url: 'https://www.apkmirror.com/uploads/?appcategory=twitter' },
		{ appName: 'youtube', url: 'https://www.apkmirror.com/uploads/?appcategory=youtube' }
	];

	await Promise.all(apps.map(app => this.broker.call("scraper.scrapeApkMirrorUploads", app)));
});
```

## Katkıda Bulunma

Katkıda bulunmak isterseniz, lütfen bir pull request gönderin veya bir issue açın. Geri bildiriminiz ve katkılarınız için teşekkür ederiz!

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın.
```

Bu `README.md` dosyası, projenizin nasıl kurulacağını, çalıştırılacağını ve hangi servislerin nasıl çalıştığını açıklar. Ayrıca, katılım ve lisans bilgilerini de içerir.
