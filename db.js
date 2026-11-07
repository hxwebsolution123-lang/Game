const mysql = require('mysql2/promise');
let pool = null;
async function initDb() {
  if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER) return false;
  pool = mysql.createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME,waitForConnections:true,connectionLimit:5,charset:'utf8mb4'});
  await pool.query(`CREATE TABLE IF NOT EXISTS hx_settings (setting_key VARCHAR(80) PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS hx_players (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, player_token CHAR(64) NOT NULL UNIQUE, display_name VARCHAR(18) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS hx_matches (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, room_code VARCHAR(5) NOT NULL, winner_name VARCHAR(18) NOT NULL, player_count TINYINT UNSIGNED NOT NULL, duration_seconds INT UNSIGNED DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(created_at)) ENGINE=InnoDB`);
  return true;
}
async function getSetting(key, fallback) { if(!pool)return fallback; const [r]=await pool.query('SELECT setting_value FROM hx_settings WHERE setting_key=?',[key]); return r[0]?.setting_value ?? fallback; }
async function setSetting(key,value) { if(pool) await pool.query('INSERT INTO hx_settings(setting_key,setting_value) VALUES(?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',[key,String(value)]); }
async function upsertPlayer(token,name) { if(pool) await pool.query('INSERT INTO hx_players(player_token,display_name) VALUES(?,?) ON DUPLICATE KEY UPDATE display_name=VALUES(display_name),last_seen=CURRENT_TIMESTAMP',[token,name]); }
async function saveMatch(room) { if(pool) await pool.query('INSERT INTO hx_matches(room_code,winner_name,player_count,duration_seconds) VALUES(?,?,?,?)',[room.code,room.winner?.name||'Unknown',room.players.length,Math.max(0,Math.floor((Date.now()-(room.startedAt||Date.now()))/1000))]); }
async function stats(){ if(!pool)return {database:false,players:0,matches:0,recent:[]}; const [[p]]=await pool.query('SELECT COUNT(*) n FROM hx_players'); const [[m]]=await pool.query('SELECT COUNT(*) n FROM hx_matches'); const [recent]=await pool.query('SELECT room_code,winner_name,player_count,duration_seconds,created_at FROM hx_matches ORDER BY id DESC LIMIT 10'); return {database:true,players:p.n,matches:m.n,recent}; }
module.exports={initDb,getSetting,setSetting,upsertPlayer,saveMatch,stats};
