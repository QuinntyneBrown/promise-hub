using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MentorCheckIns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MentorCheckIns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MentorMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Kind = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Engagement = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Topics = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    ActionItems = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    PrivateNotes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    FollowUpOn = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    Shared = table.Column<bool>(type: "INTEGER", nullable: false),
                    GuardianInformed = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MentorCheckIns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MentorCheckIns_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MentorCheckIns_Memberships_MentorMembershipId",
                        column: x => x.MentorMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MentorCheckIns_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MentorCheckIns_ChildId",
                table: "MentorCheckIns",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_MentorCheckIns_MentorMembershipId",
                table: "MentorCheckIns",
                column: "MentorMembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_MentorCheckIns_OrganizationId",
                table: "MentorCheckIns",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_MentorCheckIns_OrganizationId_MentorMembershipId_ChildId",
                table: "MentorCheckIns",
                columns: new[] { "OrganizationId", "MentorMembershipId", "ChildId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MentorCheckIns");
        }
    }
}
