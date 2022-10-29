setup: npm install

install: install-deps

install-deps:
	npm ci

lint:
	npx eslint .

publish:
	npm publish --dry-run

test:
	npm test

link:
	npm link

watch:
	npm run testWatch

test-coverage:
	npm test -- --coverage --coverageProvider=v8
