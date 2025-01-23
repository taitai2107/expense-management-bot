const mysql = require('mysql2/promise');

class ConnectDb {
  constructor() {
    this.pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'expense_manager',
      waitForConnections: true,
      //connectionLimit: 10,
     // queueLimit: 0
    });
  }

  async testConnect() {
    try {
      const connection = await this.pool.getConnection(); 
      console.log('Kết nối thành công');
      connection.release(); 
    } catch (error) {
      console.log('Lỗi khi kết nối:', error.message);
    }
  }
}

const dbInstance = new ConnectDb();

module.exports = {
  pool: dbInstance.pool,
  testConnect: dbInstance.testConnect.bind(dbInstance)
};
