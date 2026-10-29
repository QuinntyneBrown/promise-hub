using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OrganizationLogo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogoContentType",
                table: "Organizations",
                type: "TEXT",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoFileName",
                table: "Organizations",
                type: "TEXT",
                maxLength: 260,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoKey",
                table: "Organizations",
                type: "TEXT",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "LogoUploadedAt",
                table: "Organizations",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUploadedBy",
                table: "Organizations",
                type: "TEXT",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoContentType",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "LogoFileName",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "LogoKey",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "LogoUploadedAt",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "LogoUploadedBy",
                table: "Organizations");
        }
    }
}
