using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LessonVideo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "VideoBytes",
                table: "Lessons",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoContentType",
                table: "Lessons",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoFileName",
                table: "Lessons",
                type: "TEXT",
                maxLength: 260,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoKey",
                table: "Lessons",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "VideoUploadedAt",
                table: "Lessons",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoUploadedBy",
                table: "Lessons",
                type: "TEXT",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VideoBytes",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "VideoContentType",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "VideoFileName",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "VideoKey",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "VideoUploadedAt",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "VideoUploadedBy",
                table: "Lessons");
        }
    }
}
