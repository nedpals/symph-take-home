.PHONY: install

install:
	cd client && npm install
	cd server && npm install

up-dev:
	docker compose up --build

down:
	docker compose down