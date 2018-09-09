.PHONY: test-ci clean install

clean:
	rm -rf coverage lib

install:
	yarn

test-ci:
	yarn test --coverage
	curl -s https://codecov.io/bash | bash -s - -f coverage/coverage-final.json
