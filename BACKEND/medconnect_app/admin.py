from django.contrib import admin
from .models import Profile, PatientProfile, ResearcherProfile, Appointment, Community, CommunityMembership, CommunityPost, PostAttachment, PostLike, PostComment, ResearchStudy, StudyParticipation, MedicalRecord, VitalSigns, Medication, Immunization, Allergy, ContactRequest, StudyDocument

admin.site.register(Profile)
admin.site.register(PatientProfile)
admin.site.register(ResearcherProfile)
admin.site.register(Appointment)
admin.site.register(StudyDocument)

@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_private', 'member_count', 'created_at']
    list_filter = ['category', 'is_private', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['moderators']

@admin.register(CommunityMembership)
class CommunityMembershipAdmin(admin.ModelAdmin):
    list_display = ['community', 'member', 'joined_at', 'is_moderator']
    list_filter = ['is_moderator', 'joined_at']
    search_fields = ['community__name', 'member__user__username']

@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ['community', 'author', 'content_preview', 'like_count', 'comment_count', 'created_at']
    list_filter = ['community', 'created_at']
    search_fields = ['content', 'author__user__username', 'community__name']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'

@admin.register(PostAttachment)
class PostAttachmentAdmin(admin.ModelAdmin):
    list_display = ['post', 'filename', 'file_type', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['filename', 'post__content']

@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ['post', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['post__content', 'user__user__username']

@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ['post', 'author', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__user__username', 'post__content']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'

# Register additional models
admin.site.register(ResearchStudy)
admin.site.register(StudyParticipation)
admin.site.register(MedicalRecord)
admin.site.register(VitalSigns)
admin.site.register(Medication)
admin.site.register(Immunization)
admin.site.register(Allergy)

@admin.register(ContactRequest)
class ContactRequestAdmin(admin.ModelAdmin):
    list_display = ['researcher', 'patient', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['researcher__user__username', 'patient__user__username', 'message']
