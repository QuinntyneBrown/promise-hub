using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondBenefits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LearningBondBenefitApplications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    BenefitKey = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    RuleVersion = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ReviewVersion = table.Column<int>(type: "INTEGER", nullable: false),
                    Address = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: true),
                    SubmissionKey = table.Column<Guid>(type: "TEXT", nullable: true),
                    Reference = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    SubmittedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondBenefitApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondBenefitApplications_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LearningBondBenefitsChecks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OfferDismissedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    AnswersCiphertext = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondBenefitsChecks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondBenefitsChecks_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondBenefitApplications_OrganizationId",
                table: "LearningBondBenefitApplications",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondBenefitApplications_OrganizationId_HouseholdId_BenefitKey",
                table: "LearningBondBenefitApplications",
                columns: new[] { "OrganizationId", "HouseholdId", "BenefitKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondBenefitApplications_SubmissionKey",
                table: "LearningBondBenefitApplications",
                column: "SubmissionKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondBenefitsChecks_OrganizationId",
                table: "LearningBondBenefitsChecks",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondBenefitsChecks_OrganizationId_HouseholdId",
                table: "LearningBondBenefitsChecks",
                columns: new[] { "OrganizationId", "HouseholdId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningBondBenefitApplications");

            migrationBuilder.DropTable(
                name: "LearningBondBenefitsChecks");
        }
    }
}
