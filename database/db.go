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
	CREATE TABLE IF NOT EXISTS ai_configs (
		provider TEXT PRIMARY KEY,
		api_key TEXT NOT NULL,
		base_url TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = DB.Exec(schema)
	if err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}
