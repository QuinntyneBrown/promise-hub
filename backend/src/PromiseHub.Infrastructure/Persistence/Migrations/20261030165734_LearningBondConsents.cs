using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondConsents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LearningBondClaims",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ConsentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    StartedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondClaims_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LearningBondConsents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Scope = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    TypedName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    WordingVersion = table.Column<int>(type: "INTEGER", nullable: false),
                    Language = table.Column<string>(type: "TEXT", maxLength: 5, nullable: false),
                    GivenAt = table.Column<long>(type: "INTEGER", nullable: false),
                    WithdrawnAt = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondConsents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondConsents_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondClaims_OrganizationId",
                table: "LearningBondClaims",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondClaims_OrganizationId_HouseholdId_ChildId",
                table: "LearningBondClaims",
                columns: new[] { "OrganizationId", "HouseholdId", "ChildId" });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondConsents_OrganizationId",
                table: "LearningBondConsents",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondConsents_OrganizationId_HouseholdId_ChildId",
                table: "LearningBondConsents",
                columns: new[] { "OrganizationId", "HouseholdId", "ChildId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningBondClaims");

            migrationBuilder.DropTable(
                name: "LearningBondConsents");
        }
    }
}
