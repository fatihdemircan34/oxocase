const { ServiceBroker } = require("moleculer");
const cron = require("node-cron");

const broker = new ServiceBroker({
	cacher: null
});

broker.loadServices();


broker.start()

	.then(() => console.log("Broker with configured services started successfully"))
	.catch(err => console.error("Error starting broker with configured services", err));

