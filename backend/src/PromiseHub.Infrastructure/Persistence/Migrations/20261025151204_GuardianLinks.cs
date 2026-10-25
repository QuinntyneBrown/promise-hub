using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GuardianLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Answers",
                table: "SlipSignatures",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Device",
                table: "SlipSignatures",
                type: "TEXT",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "SlipSignatures",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "SlipSignatures",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TextHash",
                table: "SlipSignatures",
                type: "TEXT",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Organizations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Text",
                table: "Deliveries",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GuardianLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SlipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TokenHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    RevokedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    FailedCodes = table.Column<int>(type: "INTEGER", nullable: false),
                    LockedUntil = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuardianLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuardianLinks_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GuardianLinks_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrustedGuardianDevices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TokenHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    ExpiresAt = table.Column<long>(type: "INTEGER", nullable: false),
                    RevokedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrustedGuardianDevices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrustedGuardianDevices_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TrustedGuardianDevices_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GuardianVerifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LinkId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CodeHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    ExpiresAt = table.Column<long>(type: "INTEGER", nullable: false),
                    UsedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuardianVerifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuardianVerifications_GuardianLinks_LinkId",
                        column: x => x.LinkId,
                        principalTable: "GuardianLinks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GuardianVerifications_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GuardianLinks_HouseholdId",
                table: "GuardianLinks",
                column: "HouseholdId");

            migrationBuilder.CreateIndex(
                name: "IX_GuardianLinks_OrganizationId",
                table: "GuardianLinks",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_GuardianLinks_TokenHash",
                table: "GuardianLinks",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GuardianVerifications_LinkId",
                table: "GuardianVerifications",
                column: "LinkId");

            migrationBuilder.CreateIndex(
                name: "IX_GuardianVerifications_OrganizationId",
                table: "GuardianVerifications",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_TrustedGuardianDevices_HouseholdId",
                table: "TrustedGuardianDevices",
                column: "HouseholdId");

            migrationBuilder.CreateIndex(
                name: "IX_TrustedGuardianDevices_OrganizationId",
                table: "TrustedGuardianDevices",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_TrustedGuardianDevices_TokenHash",
                table: "TrustedGuardianDevices",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GuardianVerifications");

            migrationBuilder.DropTable(
                name: "TrustedGuardianDevices");

            migrationBuilder.DropTable(
                name: "GuardianLinks");

            migrationBuilder.DropColumn(
                name: "Answers",
                table: "SlipSignatures");

            migrationBuilder.DropColumn(
                name: "Device",
                table: "SlipSignatures");

            migrationBuilder.DropColumn(
                name: "Language",
                table: "SlipSignatures");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "SlipSignatures");

            migrationBuilder.DropColumn(
                name: "TextHash",
                table: "SlipSignatures");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "Text",
                table: "Deliveries");
        }
    }
}
