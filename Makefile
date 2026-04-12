APP := yijing
IMAGE := $(APP)
PORT ?= 8088
DOCKER ?= docker
COMPOSE ?= $(DOCKER) compose

.PHONY: build run compose-up compose-down clean

build:
	$(DOCKER) build -t $(IMAGE) .

run: build
	$(DOCKER) run --rm -p $(PORT):8088 $(IMAGE)

compose-up:
	IMAGE=$(IMAGE) PORT=$(PORT) $(COMPOSE) up --build

compose-down:
	IMAGE=$(IMAGE) PORT=$(PORT) $(COMPOSE) down

clean:
	-$(DOCKER) rmi $(IMAGE)
