using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Badges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Badges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Icon = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Kind = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Rule = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    TargetId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CompetencyId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Badges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Badges_Competencies_CompetencyId",
                        column: x => x.CompetencyId,
                        principalTable: "Competencies",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Badges_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BadgeAwards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    BadgeId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AwardedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    AwardedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BadgeAwards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BadgeAwards_Badges_BadgeId",
                        column: x => x.BadgeId,
                        principalTable: "Badges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BadgeAwards_Memberships_MembershipId",
                        column: x => x.MembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BadgeAwards_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BadgeAwards_BadgeId_MembershipId",
                table: "BadgeAwards",
                columns: new[] { "BadgeId", "MembershipId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BadgeAwards_MembershipId",
                table: "BadgeAwards",
                column: "MembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_BadgeAwards_OrganizationId",
                table: "BadgeAwards",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Badges_CompetencyId",
                table: "Badges",
                column: "CompetencyId");

            migrationBuilder.CreateIndex(
                name: "IX_Badges_OrganizationId",
                table: "Badges",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BadgeAwards");

            migrationBuilder.DropTable(
                name: "Badges");
        }
    }
}
