using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class StaffAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "RemovedAt",
                table: "Memberships",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StaffInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    TokenHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    InvitedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    InvitedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    ExpiresAt = table.Column<long>(type: "INTEGER", nullable: false),
                    AcceptedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    WithdrawnAt = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffInvitations_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StaffInvitations_OrganizationId",
                table: "StaffInvitations",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffInvitations_TokenHash",
                table: "StaffInvitations",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StaffInvitations");

            migrationBuilder.DropColumn(
                name: "RemovedAt",
                table: "Memberships");
        }
    }
}
