using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LearningBondFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LearningBondAgreementAcceptances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AgreementVersion = table.Column<int>(type: "INTEGER", nullable: false),
                    AcceptedByMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AcceptedByName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    AcceptedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondAgreementAcceptances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondAgreementAcceptances_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LearningBondAgreements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    EffectiveOn = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    WhatWeCollect = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    WhereItGoes = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    WhatYourOrganizationSees = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondAgreements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LearningBondIntakes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    GuardianSinCiphertext = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    GuardianSinLast3 = table.Column<string>(type: "TEXT", maxLength: 3, nullable: true),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    GuardianSinDestroyedAt = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningBondIntakes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningBondIntakes_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondAgreementAcceptances_OrganizationId",
                table: "LearningBondAgreementAcceptances",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondAgreementAcceptances_OrganizationId_AgreementVersion",
                table: "LearningBondAgreementAcceptances",
                columns: new[] { "OrganizationId", "AgreementVersion" });

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondAgreements_Version",
                table: "LearningBondAgreements",
                column: "Version",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondIntakes_OrganizationId",
                table: "LearningBondIntakes",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningBondIntakes_OrganizationId_HouseholdId",
                table: "LearningBondIntakes",
                columns: new[] { "OrganizationId", "HouseholdId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningBondAgreementAcceptances");

            migrationBuilder.DropTable(
                name: "LearningBondAgreements");

            migrationBuilder.DropTable(
                name: "LearningBondIntakes");
        }
    }
}
