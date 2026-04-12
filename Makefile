APP := yijing
BIN_DIR := bin
BIN := $(BIN_DIR)/$(APP)

.PHONY: build run clean

build:
	mkdir -p $(BIN_DIR)
	go build -o $(BIN) .

run: build
	./$(BIN)

clean:
	rm -f $(BIN)
