using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PublicWebsiteRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ContactMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    Topic = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactMessages_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DonationPledges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MonthlyAmount = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    ProviderReference = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DonationPledges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DonationPledges_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VolunteerInterests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    Area = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    About = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    ScreeningAcknowledged = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VolunteerInterests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VolunteerInterests_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_OrganizationId",
                table: "ContactMessages",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_OrganizationId_Email_CreatedAt",
                table: "ContactMessages",
                columns: new[] { "OrganizationId", "Email", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DonationPledges_OrganizationId",
                table: "DonationPledges",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_DonationPledges_OrganizationId_Email_CreatedAt",
                table: "DonationPledges",
                columns: new[] { "OrganizationId", "Email", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_VolunteerInterests_OrganizationId",
                table: "VolunteerInterests",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_VolunteerInterests_OrganizationId_Email_CreatedAt",
                table: "VolunteerInterests",
                columns: new[] { "OrganizationId", "Email", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContactMessages");

            migrationBuilder.DropTable(
                name: "DonationPledges");

            migrationBuilder.DropTable(
                name: "VolunteerInterests");
        }
    }
}
