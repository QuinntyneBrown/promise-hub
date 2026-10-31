using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondLaunch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "LaunchDate",
                table: "LearningBondSettings",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LaunchMode",
                table: "LearningBondSettings",
                type: "TEXT",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "LaunchedAt",
                table: "LearningBondSettings",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LearningBondInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MessageId = table.Column<Guid>(type: "TEXT", nullable: false),
                    How = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SentAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondInvitations_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondInvitations_OrganizationId",
                table: "LearningBondInvitations",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondInvitations_OrganizationId_HouseholdId",
                table: "LearningBondInvitations",
                columns: new[] { "OrganizationId", "HouseholdId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningBondInvitations");

            migrationBuilder.DropColumn(
                name: "LaunchDate",
                table: "LearningBondSettings");

            migrationBuilder.DropColumn(
                name: "LaunchMode",
                table: "LearningBondSettings");

            migrationBuilder.DropColumn(
                name: "LaunchedAt",
                table: "LearningBondSettings");
        }
    }
}
