using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProgressionStages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "RemovedAt",
                table: "Competencies",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "StageId",
                table: "Competencies",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProgressionStages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgressionStages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgressionStages_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Competencies_StageId",
                table: "Competencies",
                column: "StageId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressionStages_OrganizationId",
                table: "ProgressionStages",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressionStages_OrganizationId_Position",
                table: "ProgressionStages",
                columns: new[] { "OrganizationId", "Position" });

            migrationBuilder.AddForeignKey(
                name: "FK_Competencies_ProgressionStages_StageId",
                table: "Competencies",
                column: "StageId",
                principalTable: "ProgressionStages",
                principalColumn: "Id");

            // Competencies made before stages existed go into a first stage of their organization (ADR 0058).
            migrationBuilder.Sql("""
                INSERT INTO ProgressionStages (Id, OrganizationId, Position, Name, Description)
                SELECT upper(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-A' || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))),
                       OrganizationId, 1, 'Stage 1', ''
                FROM (SELECT DISTINCT OrganizationId FROM Competencies WHERE StageId IS NULL);
                UPDATE Competencies
                SET StageId = (SELECT s.Id FROM ProgressionStages s WHERE s.OrganizationId = Competencies.OrganizationId ORDER BY s.Position LIMIT 1)
                WHERE StageId IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Competencies_ProgressionStages_StageId",
                table: "Competencies");

            migrationBuilder.DropTable(
                name: "ProgressionStages");

            migrationBuilder.DropIndex(
                name: "IX_Competencies_StageId",
                table: "Competencies");

            migrationBuilder.DropColumn(
                name: "RemovedAt",
                table: "Competencies");

            migrationBuilder.DropColumn(
                name: "StageId",
                table: "Competencies");
        }
    }
}
