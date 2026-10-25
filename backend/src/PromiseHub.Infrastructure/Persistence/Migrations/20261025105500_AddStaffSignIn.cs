using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffSignIn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SignInAttempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    At = table.Column<long>(type: "INTEGER", nullable: false),
                    Succeeded = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SignInAttempts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StaffUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: true),
                    MfaSecret = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffUsers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SignInAttempts_Email_At",
                table: "SignInAttempts",
                columns: new[] { "Email", "At" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffUsers_Email",
                table: "StaffUsers",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SignInAttempts");

            migrationBuilder.DropTable(
                name: "StaffUsers");
        }
    }
}
