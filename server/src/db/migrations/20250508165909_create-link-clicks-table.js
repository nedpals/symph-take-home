/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  if (!(await knex.schema.hasTable("link_clicks"))) {
    await knex.schema.createTable("link_clicks", (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.uuid("shortUrlId").notNullable().references("id").inTable("shortened_urls").onDelete("CASCADE");
      t.timestamp("timestamp").notNullable().defaultTo(knex.fn.now());
      t.string("ipAddress").nullable();
      t.text("userAgent").nullable();
      t.string("browser").nullable();
      t.string("browserVersion").nullable();
      t.string("os").nullable();
      t.string("osVersion").nullable();
      t.string("device").nullable();
      t.boolean("isMobile").notNullable().defaultTo(false);
      t.boolean("isBot").notNullable().defaultTo(false);
      t.text("referer").nullable();
    });

    // Create index for shortUrlId for faster lookups
    await knex.schema.raw(`
        CREATE INDEX link_clicks_short_url_id_idx ON link_clicks ("shortUrlId");
      `);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  if (await knex.schema.hasTable("link_clicks")) {
    await knex.schema.dropTable("link_clicks");
    await knex.schema.raw(`
        DROP INDEX IF EXISTS link_clicks_short_url_id_idx;
      `);
  }
};
