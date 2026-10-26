using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class WebsiteSlug : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WebsiteSlug",
                table: "Organizations",
                type: "TEXT",
                maxLength: 60,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_WebsiteSlug",
                table: "Organizations",
                column: "WebsiteSlug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Organizations_WebsiteSlug",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "WebsiteSlug",
                table: "Organizations");
        }
    }
}
