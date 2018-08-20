INSTALL_DIR=$(TARGET_DIR)/ads
all: shijin-ads
.PHONY: clean cleanall

check_env:
	@if [ "$(TARGET_DIR)" = "" ]; then echo "ERROR: TARGET_DIR was not set"; exit 1; fi
	@if [ "$(TAG_VERSION)" = "" ]; then echo "ERROR: TAG_VERSION was not set"; exit 1; fi
	@if [ "$(REGISTRY)" = "" ]; then echo "ERROR: REGISTRY was not set"; exit 1; fi

shijin-ads:check_env
	test -e node_modules || npm install
	test -e typings || typings install
	tsc
install:check_env
	cp -r docker/* $(TARGET_DIR)/docker
	


image:check_env
	cd $(INSTALL_DIR) && sudo docker build . -t $(REGISTRY)/shijin/ads:$(TAG_VERSION)

push:check_env
	sudo docker push $(REGISTRY)/shijin/ads:$(TAG_VERSION)

	
clean:
	rm -rf logs/*
cleanall:
	rm -rf logs/*

