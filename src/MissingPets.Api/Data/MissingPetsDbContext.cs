using Microsoft.EntityFrameworkCore;
using MissingPets.Api.Data.Entities;

namespace MissingPets.Api.Data;

public sealed class MissingPetsDbContext(DbContextOptions<MissingPetsDbContext> options) : DbContext(options)
{
    public DbSet<PetPost> Posts => Set<PetPost>();

    public DbSet<PostPhoto> PostPhotos => Set<PostPhoto>();

    public DbSet<Comment> Comments => Set<Comment>();

    public DbSet<Message> Messages => Set<Message>();

    public DbSet<ManagementToken> ManagementTokens => Set<ManagementToken>();

    public DbSet<AbuseReport> AbuseReports => Set<AbuseReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("postgis");

        modelBuilder.Entity<PetPost>(entity =>
        {
            entity.ToTable("posts");
            entity.HasKey(post => post.Id);
            entity.Property(post => post.Id).HasColumnName("id");
            entity.Property(post => post.PetName).HasColumnName("pet_name").HasMaxLength(120).IsRequired();
            entity.Property(post => post.PetType).HasColumnName("pet_type").HasMaxLength(64).IsRequired();
            entity.Property(post => post.Accessories).HasColumnName("accessories").HasMaxLength(500);
            entity.Property(post => post.DefiningFeatures).HasColumnName("defining_features").HasMaxLength(2000).IsRequired();
            entity.Property(post => post.Status).HasColumnName("status").HasMaxLength(32).IsRequired();
            entity.Property(post => post.LastSeenGeography).HasColumnName("last_seen_geography").HasColumnType("geography (point)").IsRequired();
            entity.Property(post => post.LastSeenHumanReadable).HasColumnName("last_seen_human_readable").HasMaxLength(300).IsRequired();
            entity.Property(post => post.PublicAreaLabel).HasColumnName("public_area_label").HasMaxLength(300).IsRequired();
            entity.Property(post => post.PublicApproximateGeography).HasColumnName("public_approximate_geography").HasColumnType("geography (point)").IsRequired();
            entity.Property(post => post.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(post => post.UpdatedAt).HasColumnName("updated_at").IsRequired();
            entity.Property(post => post.ModerationState).HasColumnName("moderation_state").HasMaxLength(32).IsRequired();
            entity.HasIndex(post => post.LastSeenGeography).HasMethod("GIST");
            entity.HasIndex(post => new { post.Status, post.PetType });
        });

        modelBuilder.Entity<PostPhoto>(entity =>
        {
            entity.ToTable("post_photos");
            entity.HasKey(photo => photo.Id);
            entity.Property(photo => photo.Id).HasColumnName("id");
            entity.Property(photo => photo.PostId).HasColumnName("post_id");
            entity.Property(photo => photo.ObjectKey).HasColumnName("object_key").HasMaxLength(512).IsRequired();
            entity.Property(photo => photo.DisplayUrl).HasColumnName("display_url").HasMaxLength(1000).IsRequired();
            entity.Property(photo => photo.SortOrder).HasColumnName("sort_order").IsRequired();
            entity.Property(photo => photo.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(photo => photo.ScanState).HasColumnName("scan_state").HasMaxLength(32).IsRequired();
            entity.HasIndex(photo => new { photo.PostId, photo.SortOrder });
            entity.HasOne(photo => photo.Post).WithMany(post => post.Photos).HasForeignKey(photo => photo.PostId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.ToTable("comments");
            entity.HasKey(comment => comment.Id);
            entity.Property(comment => comment.Id).HasColumnName("id");
            entity.Property(comment => comment.PostId).HasColumnName("post_id");
            entity.Property(comment => comment.Body).HasColumnName("body").HasMaxLength(2000).IsRequired();
            entity.Property(comment => comment.AnonymousDisplayName).HasColumnName("anonymous_display_name").HasMaxLength(120).IsRequired();
            entity.Property(comment => comment.ModerationState).HasColumnName("moderation_state").HasMaxLength(32).IsRequired();
            entity.Property(comment => comment.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.HasIndex(comment => new { comment.PostId, comment.CreatedAt });
            entity.HasOne(comment => comment.Post).WithMany(post => post.Comments).HasForeignKey(comment => comment.PostId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("messages");
            entity.HasKey(message => message.Id);
            entity.Property(message => message.Id).HasColumnName("id");
            entity.Property(message => message.PostId).HasColumnName("post_id");
            entity.Property(message => message.Body).HasColumnName("body").HasMaxLength(2000).IsRequired();
            entity.Property(message => message.SenderContact).HasColumnName("sender_contact").HasMaxLength(300);
            entity.Property(message => message.ModerationState).HasColumnName("moderation_state").HasMaxLength(32).IsRequired();
            entity.Property(message => message.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.HasIndex(message => message.PostId);
            entity.HasOne(message => message.Post).WithMany(post => post.Messages).HasForeignKey(message => message.PostId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ManagementToken>(entity =>
        {
            entity.ToTable("management_tokens");
            entity.HasKey(token => token.Id);
            entity.Property(token => token.Id).HasColumnName("id");
            entity.Property(token => token.PostId).HasColumnName("post_id");
            entity.Property(token => token.TokenHash).HasColumnName("token_hash").HasMaxLength(128).IsRequired();
            entity.Property(token => token.ExpiresAt).HasColumnName("expires_at");
            entity.Property(token => token.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(token => token.LastUsedAt).HasColumnName("last_used_at");
            entity.HasIndex(token => token.TokenHash).IsUnique();
            entity.HasOne(token => token.Post).WithMany(post => post.ManagementTokens).HasForeignKey(token => token.PostId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AbuseReport>(entity =>
        {
            entity.ToTable("abuse_reports");
            entity.HasKey(report => report.Id);
            entity.Property(report => report.Id).HasColumnName("id");
            entity.Property(report => report.TargetType).HasColumnName("target_type").HasMaxLength(32).IsRequired();
            entity.Property(report => report.TargetId).HasColumnName("target_id").IsRequired();
            entity.Property(report => report.Reason).HasColumnName("reason").HasMaxLength(120).IsRequired();
            entity.Property(report => report.Details).HasColumnName("details").HasMaxLength(2000);
            entity.Property(report => report.RequesterIpHash).HasColumnName("requester_ip_hash").HasMaxLength(128);
            entity.Property(report => report.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(report => report.ReviewState).HasColumnName("review_state").HasMaxLength(32).IsRequired();
            entity.HasIndex(report => new { report.TargetType, report.TargetId });
        });
    }
}
