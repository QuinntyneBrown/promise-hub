using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MembershipDeactivation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "DeactivatedAt",
                table: "Memberships",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeactivatedBy",
                table: "Memberships",
                type: "TEXT",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeactivatedAt",
                table: "Memberships");

            migrationBuilder.DropColumn(
                name: "DeactivatedBy",
                table: "Memberships");
        }
    }
}
