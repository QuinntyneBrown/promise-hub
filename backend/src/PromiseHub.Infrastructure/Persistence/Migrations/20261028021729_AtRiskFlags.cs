using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AtRiskFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AtRiskFlags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RaisedByMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Severity = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    RaisedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    ResolvedByMembershipId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Outcome = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    ResolutionNote = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    ResolvedAt = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AtRiskFlags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AtRiskFlags_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AtRiskFlags_Memberships_RaisedByMembershipId",
                        column: x => x.RaisedByMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AtRiskFlags_Memberships_ResolvedByMembershipId",
                        column: x => x.ResolvedByMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AtRiskFlags_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AtRiskFlags_ChildId",
                table: "AtRiskFlags",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_AtRiskFlags_OrganizationId",
                table: "AtRiskFlags",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_AtRiskFlags_OrganizationId_ChildId_ResolvedAt",
                table: "AtRiskFlags",
                columns: new[] { "OrganizationId", "ChildId", "ResolvedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AtRiskFlags_RaisedByMembershipId",
                table: "AtRiskFlags",
                column: "RaisedByMembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_AtRiskFlags_ResolvedByMembershipId",
                table: "AtRiskFlags",
                column: "ResolvedByMembershipId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AtRiskFlags");
        }
    }
}
