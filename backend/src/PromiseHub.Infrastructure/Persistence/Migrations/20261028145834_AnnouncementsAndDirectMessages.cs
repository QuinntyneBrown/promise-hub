using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AnnouncementsAndDirectMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Announcements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Body = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    ProgramId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Audience = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SendAt = table.Column<long>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    CreatedByMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    CreatedByRole = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    GuardianMessageId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Announcements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Announcements_Memberships_CreatedByMembershipId",
                        column: x => x.CreatedByMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Announcements_Messages_GuardianMessageId",
                        column: x => x.GuardianMessageId,
                        principalTable: "Messages",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Announcements_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Announcements_Programs_ProgramId",
                        column: x => x.ProgramId,
                        principalTable: "Programs",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DirectMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    YouthMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MentorMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SenderMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Body = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    SentAt = table.Column<long>(type: "INTEGER", nullable: false),
                    ReadAt = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DirectMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DirectMessages_Memberships_MentorMembershipId",
                        column: x => x.MentorMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DirectMessages_Memberships_SenderMembershipId",
                        column: x => x.SenderMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DirectMessages_Memberships_YouthMembershipId",
                        column: x => x.YouthMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DirectMessages_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementReads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AnnouncementId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ReadAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementReads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementReads_Announcements_AnnouncementId",
                        column: x => x.AnnouncementId,
                        principalTable: "Announcements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementReads_Memberships_MembershipId",
                        column: x => x.MembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementReads_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementReads_AnnouncementId_MembershipId",
                table: "AnnouncementReads",
                columns: new[] { "AnnouncementId", "MembershipId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementReads_MembershipId",
                table: "AnnouncementReads",
                column: "MembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementReads_OrganizationId",
                table: "AnnouncementReads",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_CreatedByMembershipId",
                table: "Announcements",
                column: "CreatedByMembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_GuardianMessageId",
                table: "Announcements",
                column: "GuardianMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_OrganizationId",
                table: "Announcements",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_OrganizationId_SendAt",
                table: "Announcements",
                columns: new[] { "OrganizationId", "SendAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_ProgramId",
                table: "Announcements",
                column: "ProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectMessages_MentorMembershipId",
                table: "DirectMessages",
                column: "MentorMembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectMessages_OrganizationId",
                table: "DirectMessages",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectMessages_OrganizationId_YouthMembershipId_SentAt",
                table: "DirectMessages",
                columns: new[] { "OrganizationId", "YouthMembershipId", "SentAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DirectMessages_SenderMembershipId",
                table: "DirectMessages",
                column: "SenderMembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectMessages_YouthMembershipId",
                table: "DirectMessages",
                column: "YouthMembershipId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnnouncementReads");

            migrationBuilder.DropTable(
                name: "DirectMessages");

            migrationBuilder.DropTable(
                name: "Announcements");
        }
    }
}
