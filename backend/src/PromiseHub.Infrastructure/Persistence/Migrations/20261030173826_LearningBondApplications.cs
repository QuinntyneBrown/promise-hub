using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LearningBondApplications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ClaimId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Province = table.Column<string>(type: "TEXT", maxLength: 2, nullable: false),
                    Provider = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: true),
                    Address = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    ReviewVersion = table.Column<int>(type: "INTEGER", nullable: false),
                    SubmissionKey = table.Column<Guid>(type: "TEXT", nullable: true),
                    ProviderReference = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    SubmittedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondApplications_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondApplications_OrganizationId",
                table: "LearningBondApplications",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondApplications_OrganizationId_ClaimId",
                table: "LearningBondApplications",
                columns: new[] { "OrganizationId", "ClaimId" });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondApplications_SubmissionKey",
                table: "LearningBondApplications",
                column: "SubmissionKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningBondApplications");
        }
    }
}
