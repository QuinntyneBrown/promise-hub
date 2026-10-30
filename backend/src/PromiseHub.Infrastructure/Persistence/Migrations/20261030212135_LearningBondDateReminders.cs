using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondDateReminders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ConfirmedAmount",
                table: "LearningBondBenefitApplications",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "StartedAt",
                table: "LearningBondBenefitApplications",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LearningBondDateReminders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Kind = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: true),
                    BenefitKey = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    DueOn = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    EventOn = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    TurnedOffAt = table.Column<long>(type: "INTEGER", nullable: true),
                    SentAt = table.Column<long>(type: "INTEGER", nullable: true),
                    MissedAt = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondDateReminders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondDateReminders_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondDateReminders_OrganizationId",
                table: "LearningBondDateReminders",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondDateReminders_OrganizationId_HouseholdId_DueOn",
                table: "LearningBondDateReminders",
                columns: new[] { "OrganizationId", "HouseholdId", "DueOn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningBondDateReminders");

            migrationBuilder.DropColumn(
                name: "ConfirmedAmount",
                table: "LearningBondBenefitApplications");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "LearningBondBenefitApplications");
        }
    }
}
