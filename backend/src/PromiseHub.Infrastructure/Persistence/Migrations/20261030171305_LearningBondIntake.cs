using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondIntake : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TaxFiled",
                table: "LearningBondIntakes",
                type: "TEXT",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChildSinCiphertext",
                table: "LearningBondClaims",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChildSinLast3",
                table: "LearningBondClaims",
                type: "TEXT",
                maxLength: 3,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PausedReason",
                table: "LearningBondClaims",
                type: "TEXT",
                maxLength: 30,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TaxFiled",
                table: "LearningBondIntakes");

            migrationBuilder.DropColumn(
                name: "ChildSinCiphertext",
                table: "LearningBondClaims");

            migrationBuilder.DropColumn(
                name: "ChildSinLast3",
                table: "LearningBondClaims");

            migrationBuilder.DropColumn(
                name: "PausedReason",
                table: "LearningBondClaims");
        }
    }
}
