using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class IncidentReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Outcome",
                table: "Incidents",
                type: "TEXT",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewNote",
                table: "Incidents",
                type: "TEXT",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ReviewedAt",
                table: "Incidents",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewedBy",
                table: "Incidents",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "IncidentFollowUps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    IncidentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Text = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    WrittenBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    WrittenAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentFollowUps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IncidentFollowUps_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IncidentFollowUps_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IncidentFollowUps_IncidentId",
                table: "IncidentFollowUps",
                column: "IncidentId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentFollowUps_OrganizationId",
                table: "IncidentFollowUps",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IncidentFollowUps");

            migrationBuilder.DropColumn(
                name: "Outcome",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ReviewNote",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ReviewedBy",
                table: "Incidents");
        }
    }
}
