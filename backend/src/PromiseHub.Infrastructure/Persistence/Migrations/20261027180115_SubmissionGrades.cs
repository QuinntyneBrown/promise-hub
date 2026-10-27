using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SubmissionGrades : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReviewComment",
                table: "AssignmentSubmissions",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Scores",
                table: "AssignmentSubmissions",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "AssignmentSubmissions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReviewComment",
                table: "AssignmentSubmissions");

            migrationBuilder.DropColumn(
                name: "Scores",
                table: "AssignmentSubmissions");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "AssignmentSubmissions");
        }
    }
}
