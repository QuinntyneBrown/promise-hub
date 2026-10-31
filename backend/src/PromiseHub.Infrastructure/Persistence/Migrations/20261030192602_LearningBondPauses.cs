using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondPauses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "ClosedAt",
                table: "LearningBondConsents",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PausedAt",
                table: "LearningBondClaims",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LearningBondChoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ClaimId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Remind = table.Column<bool>(type: "INTEGER", nullable: false),
                    ChosenAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondChoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondChoices_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LearningBondReminders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ClaimId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DueAt = table.Column<long>(type: "INTEGER", nullable: false),
                    SentAt = table.Column<long>(type: "INTEGER", nullable: true),
                    CancelledAt = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondReminders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondReminders_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondChoices_OrganizationId",
                table: "LearningBondChoices",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondChoices_OrganizationId_ClaimId",
                table: "LearningBondChoices",
                columns: new[] { "OrganizationId", "ClaimId" });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondReminders_OrganizationId",
                table: "LearningBondReminders",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondReminders_OrganizationId_ClaimId",
                table: "LearningBondReminders",
                columns: new[] { "OrganizationId", "ClaimId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningBondChoices");

            migrationBuilder.DropTable(
                name: "LearningBondReminders");

            migrationBuilder.DropColumn(
                name: "ClosedAt",
                table: "LearningBondConsents");

            migrationBuilder.DropColumn(
                name: "PausedAt",
                table: "LearningBondClaims");
        }
    }
}
