using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace MissingPets.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgisSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.CreateTable(
                name: "abuse_reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    target_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    details = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    requester_ip_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    review_state = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_abuse_reports", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "posts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    pet_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    pet_type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    accessories = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    defining_features = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    last_seen_geography = table.Column<Point>(type: "geography (point)", nullable: false),
                    last_seen_human_readable = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    public_area_label = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    public_approximate_geography = table.Column<Point>(type: "geography (point)", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    moderation_state = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_posts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "comments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    post_id = table.Column<Guid>(type: "uuid", nullable: false),
                    body = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    anonymous_display_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    moderation_state = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_comments", x => x.id);
                    table.ForeignKey(
                        name: "FK_comments_posts_post_id",
                        column: x => x.post_id,
                        principalTable: "posts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "management_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    post_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    last_used_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_management_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_management_tokens_posts_post_id",
                        column: x => x.post_id,
                        principalTable: "posts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    post_id = table.Column<Guid>(type: "uuid", nullable: false),
                    body = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    sender_contact = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    moderation_state = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_messages", x => x.id);
                    table.ForeignKey(
                        name: "FK_messages_posts_post_id",
                        column: x => x.post_id,
                        principalTable: "posts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "post_photos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    post_id = table.Column<Guid>(type: "uuid", nullable: false),
                    object_key = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    display_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    scan_state = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_post_photos", x => x.id);
                    table.ForeignKey(
                        name: "FK_post_photos_posts_post_id",
                        column: x => x.post_id,
                        principalTable: "posts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_abuse_reports_target_type_target_id",
                table: "abuse_reports",
                columns: new[] { "target_type", "target_id" });

            migrationBuilder.CreateIndex(
                name: "IX_comments_post_id_created_at",
                table: "comments",
                columns: new[] { "post_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_management_tokens_post_id",
                table: "management_tokens",
                column: "post_id");

            migrationBuilder.CreateIndex(
                name: "IX_management_tokens_token_hash",
                table: "management_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_messages_post_id",
                table: "messages",
                column: "post_id");

            migrationBuilder.CreateIndex(
                name: "IX_post_photos_post_id_sort_order",
                table: "post_photos",
                columns: new[] { "post_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "IX_posts_last_seen_geography",
                table: "posts",
                column: "last_seen_geography")
                .Annotation("Npgsql:IndexMethod", "GIST");

            migrationBuilder.CreateIndex(
                name: "IX_posts_status_pet_type",
                table: "posts",
                columns: new[] { "status", "pet_type" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "abuse_reports");

            migrationBuilder.DropTable(
                name: "comments");

            migrationBuilder.DropTable(
                name: "management_tokens");

            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "post_photos");

            migrationBuilder.DropTable(
                name: "posts");
        }
    }
}
