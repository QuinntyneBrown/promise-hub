using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SlipReminders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SlipReminders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SlipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Kind = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Slot = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    SentAt = table.Column<long>(type: "INTEGER", nullable: false),
                    Unreachable = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlipReminders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SlipReminders_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SlipReminders_PermissionSlips_SlipId",
                        column: x => x.SlipId,
                        principalTable: "PermissionSlips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SlipReminders_OrganizationId",
                table: "SlipReminders",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_SlipReminders_SlipId_HouseholdId_Slot",
                table: "SlipReminders",
                columns: new[] { "SlipId", "HouseholdId", "Slot" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SlipReminders");
        }
    }
}
