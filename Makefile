APP := yijing
IMAGE := $(APP)
PORT ?= 8088
DOCKER ?= docker

.PHONY: build run clean

build:
	$(DOCKER) build -t $(IMAGE) .

run: build
	$(DOCKER) run --rm -p $(PORT):8088 $(IMAGE)

clean:
	-$(DOCKER) rmi $(IMAGE)
