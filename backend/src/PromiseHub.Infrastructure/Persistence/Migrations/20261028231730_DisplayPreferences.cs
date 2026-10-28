using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DisplayPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ReduceMotion",
                table: "StaffUsers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TextSize",
                table: "StaffUsers",
                type: "TEXT",
                maxLength: 16,
                nullable: false,
                defaultValue: "default");

            migrationBuilder.AddColumn<string>(
                name: "Theme",
                table: "StaffUsers",
                type: "TEXT",
                maxLength: 16,
                nullable: false,
                defaultValue: "system");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReduceMotion",
                table: "StaffUsers");

            migrationBuilder.DropColumn(
                name: "TextSize",
                table: "StaffUsers");

            migrationBuilder.DropColumn(
                name: "Theme",
                table: "StaffUsers");
        }
    }
}
