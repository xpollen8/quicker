module.exports = class MyWrap {
	constructor(config) {
		const defaultConfig = {
			insecureAuth: true,
			host     : 'localhost',
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
			user     : 'root',
			password: '',
			database : ''
		};
		this.myConfig = {
			...defaultConfig,
			...config,
		};
	}
	setDb = (db) => this.db = db;
	getDb = () => this.db;
	start = async () => {
		this.setDb(await require('mysql2/promise').createPool(this.myConfig));
	}
	finish = async () => {
		const db = this.db;
		await db && db.end();
	}
}
