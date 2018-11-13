.PHONY: clean install test build publish test-ci

clean:
	rm -rf coverage lib

install:
	yarn

test:
	yarn type:check
	yarn test --coverage

build:
	yarn build
	yarn type:emit

publish:
	make clean
	make install
	make build
	npm publish


# CI
test-ci:
	make test
	curl -s https://codecov.io/bash | bash -s - -f coverage/coverage-final.json
