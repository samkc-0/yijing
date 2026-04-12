package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	addr := envOrDefault("ADDR", ":8020")
	bookDir := envOrDefault("BOOK_DIR", "book")

	handler, err := newServer(bookDir)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("serving %s on http://localhost%s", bookDir, addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}

func newServer(bookDir string) (http.Handler, error) {
	root, err := filepath.Abs(bookDir)
	if err != nil {
		return nil, err
	}

	indexPath := filepath.Join(root, "index.html")
	if _, err := os.Stat(indexPath); err != nil {
		return nil, err
	}

	fileServer := http.FileServer(http.Dir(root))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cleanPath := filepath.Clean("/" + r.URL.Path)
		fullPath := filepath.Join(root, strings.TrimPrefix(cleanPath, "/"))

		if info, err := os.Stat(fullPath); err == nil && !info.IsDir() {
			fileServer.ServeHTTP(w, r)
			return
		}

		if strings.HasPrefix(cleanPath, "/api/") {
			http.NotFound(w, r)
			return
		}

		http.ServeFile(w, r, indexPath)
	}), nil
}

func envOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
