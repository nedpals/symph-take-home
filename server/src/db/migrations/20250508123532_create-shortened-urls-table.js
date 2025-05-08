const {
  createOnUpdateTrigger,
  dropOnUpdateTrigger,
} = require("../util/db-util");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  if (!(await knex.schema.hasTable("shortened_urls"))) {
    await knex.schema.createTable("shortened_urls", (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.text("originalURL").notNullable();
      t.string("slug", 20).notNullable().unique();
      t.timestamp("expiresAt").nullable();
      t.integer("clickCount").defaultTo(0).notNullable();
      t.timestamp("lastAccessedAt").nullable();
      t.jsonb("utmParameters").nullable();
      t.timestamps(true, true, true);
    });

    // Auto update the updated_at column
    await createOnUpdateTrigger(knex, "shortened_urls");
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  if (await knex.schema.hasTable("shortened_urls")) {
    await dropOnUpdateTrigger(knex, "shortened_urls");
    await knex.schema.dropTable("shortened_urls");
  }
};
