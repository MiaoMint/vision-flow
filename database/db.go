package database

import (
	"log"

	"firebringer/storage"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sqlx.DB

func InitDB() error {
	dbPath, err := storage.GetDatabasePath()
	if err != nil {
		return err
	}
	log.Printf("Database path: %s", dbPath)

	DB, err = sqlx.Connect("sqlite3", dbPath)
	if err != nil {
		return err
	}

	schema := `
	CREATE TABLE IF NOT EXISTS model_providers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		type TEXT NOT NULL,
		api_key TEXT NOT NULL,
		base_url TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS projects (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		description TEXT DEFAULT '',
		workflow TEXT DEFAULT '',
		cover_image TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS assets (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		project_id INTEGER NOT NULL,
		type TEXT NOT NULL,
		path TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(project_id) REFERENCES projects(id)
	);
	`
	_, err = DB.Exec(schema)
	if err != nil {
		return err
	}

	// Auto-migrate for existing tables
	// Ignore errors if columns already exist
	DB.Exec("ALTER TABLE projects ADD COLUMN workflow TEXT DEFAULT ''")
	DB.Exec("ALTER TABLE projects ADD COLUMN cover_image TEXT DEFAULT ''")

	log.Println("Database initialized successfully")
	return nil
}
