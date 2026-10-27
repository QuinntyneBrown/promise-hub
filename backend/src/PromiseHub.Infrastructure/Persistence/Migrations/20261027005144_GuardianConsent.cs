using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GuardianConsent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ForConsent",
                table: "GuardianLinks",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "GuardianConsents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LinkId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SignedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Relationship = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Wording = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    WordingHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Language = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Device = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    Reference = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SignedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    WithdrawnAt = table.Column<long>(type: "INTEGER", nullable: true),
                    WithdrawnBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuardianConsents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuardianConsents_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GuardianConsents_GuardianLinks_LinkId",
                        column: x => x.LinkId,
                        principalTable: "GuardianLinks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GuardianConsents_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GuardianConsents_ChildId",
                table: "GuardianConsents",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_GuardianConsents_LinkId",
                table: "GuardianConsents",
                column: "LinkId");

            migrationBuilder.CreateIndex(
                name: "IX_GuardianConsents_OrganizationId",
                table: "GuardianConsents",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GuardianConsents");

            migrationBuilder.DropColumn(
                name: "ForConsent",
                table: "GuardianLinks");
        }
    }
}
