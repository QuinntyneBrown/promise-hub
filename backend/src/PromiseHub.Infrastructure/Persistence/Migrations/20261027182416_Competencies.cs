using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Competencies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Competencies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Competencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Competencies_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompetencyAssessments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CompetencyId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Level = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    AssessorMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssessorName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    At = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetencyAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompetencyAssessments_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetencyAssessments_Competencies_CompetencyId",
                        column: x => x.CompetencyId,
                        principalTable: "Competencies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetencyAssessments_Memberships_AssessorMembershipId",
                        column: x => x.AssessorMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetencyAssessments_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Competencies_OrganizationId",
                table: "Competencies",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Competencies_OrganizationId_Position",
                table: "Competencies",
                columns: new[] { "OrganizationId", "Position" });

            migrationBuilder.CreateIndex(
                name: "IX_CompetencyAssessments_AssessorMembershipId",
                table: "CompetencyAssessments",
                column: "AssessorMembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetencyAssessments_ChildId_CompetencyId",
                table: "CompetencyAssessments",
                columns: new[] { "ChildId", "CompetencyId" });

            migrationBuilder.CreateIndex(
                name: "IX_CompetencyAssessments_CompetencyId",
                table: "CompetencyAssessments",
                column: "CompetencyId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetencyAssessments_OrganizationId",
                table: "CompetencyAssessments",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompetencyAssessments");

            migrationBuilder.DropTable(
                name: "Competencies");
        }
    }
}
