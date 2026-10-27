using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MentorAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CohortMentors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProgramId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MentorMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    IsLead = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CohortMentors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CohortMentors_Memberships_MentorMembershipId",
                        column: x => x.MentorMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CohortMentors_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CohortMentors_Programs_ProgramId",
                        column: x => x.ProgramId,
                        principalTable: "Programs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "YouthMentors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MentorMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssignedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_YouthMentors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_YouthMentors_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_YouthMentors_Memberships_MentorMembershipId",
                        column: x => x.MentorMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_YouthMentors_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CohortMentors_MentorMembershipId",
                table: "CohortMentors",
                column: "MentorMembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_CohortMentors_OrganizationId",
                table: "CohortMentors",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_CohortMentors_ProgramId_MentorMembershipId",
                table: "CohortMentors",
                columns: new[] { "ProgramId", "MentorMembershipId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_YouthMentors_ChildId",
                table: "YouthMentors",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_YouthMentors_MentorMembershipId",
                table: "YouthMentors",
                column: "MentorMembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_YouthMentors_OrganizationId",
                table: "YouthMentors",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_YouthMentors_OrganizationId_ChildId",
                table: "YouthMentors",
                columns: new[] { "OrganizationId", "ChildId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CohortMentors");

            migrationBuilder.DropTable(
                name: "YouthMentors");
        }
    }
}
