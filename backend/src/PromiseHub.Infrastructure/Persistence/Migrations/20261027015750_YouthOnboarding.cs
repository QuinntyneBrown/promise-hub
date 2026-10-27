using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class YouthOnboarding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "YouthOnboardings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Step = table.Column<int>(type: "INTEGER", nullable: false),
                    PreferredName = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Pronouns = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    LessonReminders = table.Column<bool>(type: "INTEGER", nullable: false),
                    MentorMessages = table.Column<bool>(type: "INTEGER", nullable: false),
                    Announcements = table.Column<bool>(type: "INTEGER", nullable: false),
                    StartedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    CompletedAt = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_YouthOnboardings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_YouthOnboardings_Memberships_MembershipId",
                        column: x => x.MembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_YouthOnboardings_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_YouthOnboardings_MembershipId",
                table: "YouthOnboardings",
                column: "MembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_YouthOnboardings_OrganizationId",
                table: "YouthOnboardings",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_YouthOnboardings_OrganizationId_MembershipId",
                table: "YouthOnboardings",
                columns: new[] { "OrganizationId", "MembershipId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "YouthOnboardings");
        }
    }
}
