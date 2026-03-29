from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.http import require_http_methods
from django.db.models import Q
from functools import wraps
import json
from datetime import datetime, timedelta
from .models import Profile, PatientProfile, ResearcherProfile, Appointment, Community, CommunityMembership, CommunityPost, PostAttachment, PostLike, PostComment, ResearchStudy, StudyParticipation, MedicalRecord, VitalSigns, Medication, Immunization, Allergy, ContactRequest

def require_auth(view_func):
    """Custom decorator to check authentication"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper

@csrf_exempt
@require_auth
@require_http_methods(["PUT"])
def api_update_appointment(request, appointment_id):
    """API endpoint to update an appointment"""
    try:
        data = json.loads(request.body)
        try:
            profile = request.user.profile
        except Exception:
            return JsonResponse({'success': False, 'message': 'User profile not found'}, status=400)
        
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can update appointments'
            }, status=403)
        
        appointment = Appointment.objects.get(id=appointment_id, patient=profile)
        
        # Update fields
        if 'doctor_name' in data:
            if not isinstance(data['doctor_name'], str) or not data['doctor_name'].strip():
                return JsonResponse({'success': False, 'message': 'doctor_name is required'}, status=400)
            appointment.doctor_name = data['doctor_name']
        if 'doctor_specialization' in data:
            appointment.doctor_specialization = data.get('doctor_specialization', '') or ''
        if 'appointment_date' in data:
            raw_dt = data.get('appointment_date')
            if not isinstance(raw_dt, str) or not raw_dt:
                return JsonResponse({'success': False, 'message': 'appointment_date is required'}, status=400)
            try:
                appointment_date = datetime.fromisoformat(raw_dt.replace('Z', '+00:00'))
            except Exception:
                return JsonResponse({'success': False, 'message': 'Invalid appointment_date format'}, status=400)
            appointment.appointment_date = appointment_date
        if 'address' in data:
            if not isinstance(data['address'], str) or not data['address'].strip():
                return JsonResponse({'success': False, 'message': 'address is required'}, status=400)
            appointment.address = data['address']
        if 'reason' in data:
            if not isinstance(data['reason'], str) or not data['reason'].strip():
                return JsonResponse({'success': False, 'message': 'reason is required'}, status=400)
            appointment.reason = data['reason']
        if 'notes' in data:
            appointment.notes = data.get('notes', '') or ''
        if 'status' in data:
            appointment.status = data['status']
        
        appointment.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Appointment updated successfully',
            'appointment': {
                'id': appointment.id,
                'doctor_name': appointment.doctor_name,
                'doctor_specialization': appointment.doctor_specialization,
                'appointment_date': appointment.appointment_date.isoformat(),
                'address': appointment.address,
                'reason': appointment.reason,
                'notes': appointment.notes,
                'status': appointment.status,
                'updated_at': appointment.updated_at.isoformat()
            }
        })
        
    except Appointment.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Appointment not found'
        }, status=404)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["DELETE"])
def api_delete_appointment(request, appointment_id):
    """API endpoint to delete an appointment"""
    try:
        try:
            profile = request.user.profile
        except Exception:
            return JsonResponse({'success': False, 'message': 'User profile not found'}, status=400)
        
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can delete appointments'
            }, status=403)
        
        appointment = Appointment.objects.get(id=appointment_id, patient=profile)
        appointment.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Appointment deleted successfully'
        })
        
    except Appointment.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Appointment not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500) 

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_join_community(request, community_id):
    """API endpoint to join a community"""
    try:
        community = Community.objects.get(id=community_id)
        user_profile = request.user.profile
        
        # Check if already a member
        if CommunityMembership.objects.filter(community=community, member=user_profile).exists():
            return JsonResponse({
                'success': False,
                'message': 'Already a member of this community'
            }, status=400)
        
        # Create membership
        membership = CommunityMembership.objects.create(
            community=community,
            member=user_profile
        )
        
        return JsonResponse({
            'success': True,
            'message': f'Successfully joined {community.name}',
            'membership': {
                'id': membership.id,
                'joined_at': membership.joined_at.isoformat()
            }
        })
        
    except Community.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Community not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["DELETE"])
def api_leave_community(request, community_id):
    """API endpoint to leave a community"""
    try:
        community = Community.objects.get(id=community_id)
        user_profile = request.user.profile
        
        # Check if member
        membership = CommunityMembership.objects.filter(
            community=community, 
            member=user_profile
        ).first()
        
        if not membership:
            return JsonResponse({
                'success': False,
                'message': 'Not a member of this community'
            }, status=400)
        
        membership.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Successfully left {community.name}'
        })
        
    except Community.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Community not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_user_communities(request):
    """API endpoint to get user's joined communities"""
    try:
        user_profile = request.user.profile
        memberships = CommunityMembership.objects.filter(member=user_profile)
        
        communities_data = []
        for membership in memberships:
            community = membership.community
            communities_data.append({
                'id': str(community.id),
                'name': community.name,
                'description': community.description,
                'category': community.category,
                'isPrivate': community.is_private,
                'tags': community.tags,
                'memberCount': community.member_count,
                'lastActivity': community.last_activity.isoformat() if community.last_activity else None,
                'moderators': [mod.user.username for mod in community.moderators.all()],
                'joined_at': membership.joined_at.isoformat(),
                'is_moderator': membership.is_moderator
            })
        
        return JsonResponse({
            'success': True,
            'communities': communities_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_community_posts(request, community_id):
    """API endpoint to get posts for a community"""
    try:
        community = Community.objects.get(id=community_id)
        posts = CommunityPost.objects.filter(community=community)
        
        posts_data = []
        user_profile = request.user.profile
        
        for post in posts:
            # Check if user liked this post
            is_liked = PostLike.objects.filter(post=post, user=user_profile).exists()
            
            # Get comments
            comments = []
            for comment in post.comments.all():
                comments.append({
                    'id': comment.id,
                    'author_name': comment.author.user.get_full_name() or comment.author.user.username,
                    'author_type': comment.author.role,
                    'content': comment.content,
                    'created_at': comment.created_at.isoformat()
                })
            
            # Get attachments
            attachments = []
            for attachment in post.attachments.all():
                attachment_url = attachment.file.url if attachment.file else None
                if attachment_url and not attachment_url.startswith('http'):
                    # Make URL absolute
                    attachment_url = request.build_absolute_uri(attachment_url)
                attachments.append({
                    'id': attachment.id,
                    'name': attachment.filename,
                    'type': attachment.file_type,
                    'url': attachment_url
                })
            
            posts_data.append({
                'id': post.id,
                'author_name': post.author.user.get_full_name() or post.author.user.username,
                'author_type': post.author.role,
                'content': post.content,
                'attachments': attachments,
                'likes': post.like_count,
                'comments': comments,
                'created_at': post.created_at.isoformat(),
                'is_liked': is_liked
            })
        
        return JsonResponse({
            'success': True,
            'posts': posts_data
        })
        
    except Community.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Community not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_create_post(request, community_id):
    """API endpoint to create a post in a community"""
    try:
        # Safely get profile
        try:
            user_profile = request.user.profile
        except Exception:
            return JsonResponse({'success': False, 'message': 'User profile not found'}, status=400)
        
        community = Community.objects.get(id=community_id)
        
        # Check if user is a member of the community
        if not CommunityMembership.objects.filter(member=user_profile, community=community).exists():
            return JsonResponse({
                'success': False,
                'message': 'You must be a member of this community to post'
            }, status=403)
        
        # Handle payload depending on content type
        content_type = request.META.get('CONTENT_TYPE', '') or ''
        if content_type.startswith('multipart/form-data'):
            content = request.POST.get('content', '')
        else:
            try:
                data = json.loads(request.body or '{}')
            except json.JSONDecodeError:
                return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
            content = data.get('content', '')
        
        post = CommunityPost.objects.create(
            community=community,
            author=user_profile,
            content=content
        )
        
        # Handle file attachments if provided (FormData path)
        if request.FILES:
            for file in request.FILES.getlist('attachments'):
                PostAttachment.objects.create(
                    post=post,
                    file=file,
                    filename=file.name,
                    file_type=getattr(file, 'content_type', '')
                )
        
        return JsonResponse({
            'success': True,
            'message': 'Post created successfully',
            'post': {
                'id': post.id,
                'content': post.content,
                'created_at': post.created_at.isoformat(),
                'attachments': [
                    {
                        'id': att.id,
                        'name': att.filename,
                        'type': att.file_type,
                        'url': att.file.url if att.file else None
                    } for att in post.attachments.all()
                ]
            }
        })
        
    except Community.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Community not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["PUT"])
def api_update_post(request, post_id):
    """API endpoint to update a post"""
    try:
        try:
            user_profile = request.user.profile
        except Exception:
            return JsonResponse({'success': False, 'message': 'User profile not found'}, status=400)
        
        post = CommunityPost.objects.get(id=post_id, author=user_profile)
        
        # Handle payload depending on content type
        content_type = request.META.get('CONTENT_TYPE', '') or ''
        if content_type.startswith('multipart/form-data'):
            content = request.POST.get('content', '')
        else:
            try:
                data = json.loads(request.body or '{}')
            except json.JSONDecodeError:
                return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
            content = data.get('content', '')
        
        post.content = content
        post.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Post updated successfully',
            'post': {
                'id': post.id,
                'content': post.content,
                'updated_at': post.updated_at.isoformat()
            }
        })
        
    except CommunityPost.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Post not found or not authorized'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["DELETE"])
def api_delete_post(request, post_id):
    """API endpoint to delete a post"""
    try:
        try:
            user_profile = request.user.profile
        except Exception:
            return JsonResponse({'success': False, 'message': 'User profile not found'}, status=400)
        
        post = CommunityPost.objects.get(id=post_id, author=user_profile)
        post.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Post deleted successfully'
        })
        
    except CommunityPost.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Post not found or not authorized'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_like_post(request, post_id):
    """API endpoint to like a post"""
    try:
        user_profile = request.user.profile
        post = CommunityPost.objects.get(id=post_id)
        
        # Check if already liked
        if PostLike.objects.filter(post=post, user=user_profile).exists():
            return JsonResponse({
                'success': False,
                'message': 'Post already liked'
            }, status=400)
        
        PostLike.objects.create(post=post, user=user_profile)
        post.like_count += 1
        post.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Post liked successfully'
        })
        
    except CommunityPost.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Post not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["DELETE"])
def api_unlike_post(request, post_id):
    """API endpoint to unlike a post"""
    try:
        user_profile = request.user.profile
        post = CommunityPost.objects.get(id=post_id)
        
        # Check if liked
        like = PostLike.objects.filter(post=post, user=user_profile).first()
        if not like:
            return JsonResponse({
                'success': False,
                'message': 'Post not liked'
            }, status=400)
        
        like.delete()
        post.like_count -= 1
        post.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Post unliked successfully'
        })
        
    except CommunityPost.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Post not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_add_comment(request, post_id):
    """API endpoint to add a comment to a post"""
    try:
        data = json.loads(request.body)
        user_profile = request.user.profile
        post = CommunityPost.objects.get(id=post_id)
        
        comment = PostComment.objects.create(
            post=post,
            author=user_profile,
            content=data.get('content', '')
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Comment added successfully',
            'comment': {
                'id': comment.id,
                'content': comment.content,
                'created_at': comment.created_at.isoformat()
            }
        })
        
    except CommunityPost.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Post not found'
        }, status=404)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_create_study(request):
    """API endpoint to create a new research study"""
    try:
        data = json.loads(request.body)
        profile = request.user.profile
        
        if profile.role != 'researcher':
            return JsonResponse({
                'success': False,
                'message': 'Only researchers can create studies'
            }, status=403)
        
        # Parse dates
        start_date = None
        if data.get('startDate'):
            try:
                start_date = datetime.strptime(data.get('startDate'), '%Y-%m-%d').date()
            except ValueError:
                pass
        est_completion = None
        if data.get('estimatedCompletionDate'):
            try:
                est_completion = datetime.strptime(data.get('estimatedCompletionDate'), '%Y-%m-%d').date()
            except ValueError:
                pass

        study = ResearchStudy.objects.create(
            created_by=profile,
            title=data.get('title', '').strip(),
            description=data.get('description', '').strip(),
            phase=data.get('phase') or 'Phase I',
            sponsor=data.get('sponsor', '').strip(),
            location=data.get('location', '').strip(),
            eligibility_criteria=data.get('eligibilityCriteria', ''),
            primary_endpoint=data.get('primaryEndpoint', ''),
            estimated_enrollment=int(data.get('estimatedEnrollment') or 0),
            current_enrollment=0,
            start_date=start_date or datetime.utcnow().date(),
            estimated_completion_date=est_completion or datetime.utcnow().date(),
            status='recruiting',
            compensation=data.get('compensation', ''),
            contact_name=data.get('contactName', ''),
            contact_email=data.get('contactEmail', ''),
            contact_phone=data.get('contactPhone', ''),
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Study created successfully',
            'study': {
                'id': str(study.id),
                'title': study.title,
                'description': study.description,
                'phase': study.phase,
                'sponsor': study.sponsor,
                'location': study.location,
                'status': study.status
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_apply_study(request, study_id):
    """API endpoint for patients to apply to a study"""
    try:
        profile = request.user.profile
        
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can apply to studies'
            }, status=403)
        
        study = ResearchStudy.objects.get(id=study_id)
        
        # Check if already applied
        if StudyParticipation.objects.filter(patient=profile, study=study).exists():
            return JsonResponse({
                'success': False,
                'message': 'Already applied to this study'
            }, status=400)
        
        participation = StudyParticipation.objects.create(
            patient=profile,
            study=study,
            status='applied'
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Application submitted successfully'
        })
        
    except ResearchStudy.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Study not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_study_applicants(request, study_id):
    """List applicants/participants for a given study (researcher-only, must own the study)."""
    try:
        profile = request.user.profile
        if profile.role != 'researcher':
            return JsonResponse({'success': False, 'message': 'Only researchers can view applicants'}, status=403)

        study = ResearchStudy.objects.get(id=study_id)
        if study.created_by != profile:
            return JsonResponse({'success': False, 'message': 'Not authorized for this study'}, status=403)

        participations = StudyParticipation.objects.filter(study=study).select_related('patient__user')
        data = []
        for p in participations:
            data.append({
                'id': p.id,
                'patientId': p.patient.id,
                'patientName': f"{p.patient.user.first_name} {p.patient.user.last_name}".strip() or p.patient.user.username,
                'status': p.status,
                'appliedDate': p.applied_date.isoformat(),
                'enrolledDate': p.enrolled_date.isoformat() if p.enrolled_date else None,
                'notes': p.notes,
            })

        return JsonResponse({'success': True, 'applicants': data})
    except ResearchStudy.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Study not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_update_applicant_status(request, participation_id):
    """Update applicant/participant status: approve (screening), reject, enroll, withdraw. Researcher must own the study."""
    try:
        data = json.loads(request.body)
        action = data.get('action')  # approve|reject|enroll|withdraw
        if action not in ['approve', 'reject', 'enroll', 'withdraw']:
            return JsonResponse({'success': False, 'message': 'Invalid action'}, status=400)

        profile = request.user.profile
        if profile.role != 'researcher':
            return JsonResponse({'success': False, 'message': 'Only researchers can manage applicants'}, status=403)

        participation = StudyParticipation.objects.select_related('study').get(id=participation_id)
        if participation.study.created_by != profile:
            return JsonResponse({'success': False, 'message': 'Not authorized for this study'}, status=403)

        # Transition
        if action == 'approve':
            participation.status = 'screening'
        elif action == 'reject':
            participation.status = 'rejected'
        elif action == 'enroll':
            if participation.status != 'enrolled':
                participation.status = 'enrolled'
                participation.enrolled_date = datetime.utcnow()
                participation.study.current_enrollment = (participation.study.current_enrollment or 0) + 1
                participation.study.save()
        elif action == 'withdraw':
            if participation.status == 'enrolled' and participation.study.current_enrollment > 0:
                participation.study.current_enrollment -= 1
                participation.study.save()
            participation.status = 'withdrawn'

        if 'notes' in data:
            participation.notes = data.get('notes') or ''

        participation.save()
        return JsonResponse({'success': True, 'message': 'Status updated', 'status': participation.status})
    except StudyParticipation.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Participation not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET", "POST"])
def api_study_documents(request, study_id):
    """GET list of documents or POST a new one for a study (researcher owner)."""
    try:
        profile = request.user.profile
        study = ResearchStudy.objects.get(id=study_id)
        if study.created_by != profile:
            return JsonResponse({'success': False, 'message': 'Not authorized for this study'}, status=403)

        if request.method == 'GET':
            docs = study.documents.all()
            return JsonResponse({'success': True, 'documents': [
                {
                    'id': d.id,
                    'name': d.name,
                    'docType': d.doc_type,
                    'url': d.file.url if d.file else None,
                    'uploadedAt': d.uploaded_at.isoformat(),
                } for d in docs
            ]})

        # POST (create)
        is_multipart = request.content_type and request.content_type.startswith('multipart/form-data')
        if not is_multipart:
            return JsonResponse({'success': False, 'message': 'Use multipart/form-data for file upload'}, status=400)
        uploaded = request.FILES.get('file')
        name = request.POST.get('name') or (uploaded.name if uploaded else 'document')
        doc_type = request.POST.get('doc_type', 'other')
        if not uploaded:
            return JsonResponse({'success': False, 'message': 'No file provided'}, status=400)
        from .models import StudyDocument
        doc = StudyDocument.objects.create(
            study=study,
            uploaded_by=profile,
            file=uploaded,
            name=name,
            doc_type=doc_type
        )
        return JsonResponse({'success': True, 'document': {
            'id': doc.id,
            'name': doc.name,
            'docType': doc.doc_type,
            'url': doc.file.url,
            'uploadedAt': doc.uploaded_at.isoformat(),
        }})
    except ResearchStudy.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Study not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["DELETE"])
def api_delete_study_document(request, document_id):
    """Delete a study document (researcher owner)."""
    try:
        from .models import StudyDocument
        profile = request.user.profile
        doc = StudyDocument.objects.select_related('study').get(id=document_id)
        if doc.study.created_by != profile:
            return JsonResponse({'success': False, 'message': 'Not authorized for this study'}, status=403)
        doc.delete()
        return JsonResponse({'success': True, 'message': 'Document deleted'})
    except StudyDocument.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Document not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_study_appointments(request, study_id):
    """List appointments for a study (researcher owner)."""
    try:
        profile = request.user.profile
        if profile.role != 'researcher':
            return JsonResponse({'success': False, 'message': 'Only researchers can view study appointments'}, status=403)
        study = ResearchStudy.objects.get(id=study_id)
        if study.created_by != profile:
            return JsonResponse({'success': False, 'message': 'Not authorized for this study'}, status=403)
        appts = study.appointments.select_related('patient__user').all()
        return JsonResponse({'success': True, 'appointments': [
            {
                'id': a.id,
                'patientId': a.patient.id,
                'patientName': f"{a.patient.user.first_name} {a.patient.user.last_name}".strip() or a.patient.user.username,
                'doctor_name': a.doctor_name,
                'doctor_specialization': a.doctor_specialization,
                'appointment_date': a.appointment_date.isoformat(),
                'address': a.address,
                'reason': a.reason,
                'notes': a.notes,
                'status': a.status,
            } for a in appts
        ]})
    except ResearchStudy.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Study not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_create_study_appointment(request, study_id):
    """Researcher creates an appointment for a patient within a study."""
    try:
        data = json.loads(request.body)
        profile = request.user.profile
        if profile.role != 'researcher':
            return JsonResponse({'success': False, 'message': 'Only researchers can create study appointments'}, status=403)
        study = ResearchStudy.objects.get(id=study_id)
        if study.created_by != profile:
            return JsonResponse({'success': False, 'message': 'Not authorized for this study'}, status=403)

        patient_id = data.get('patient_id')
        try:
            patient_profile = Profile.objects.get(id=patient_id, role='patient')
        except Profile.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Patient not found'}, status=404)

        appointment_date = datetime.fromisoformat(data.get('appointment_date').replace('Z', '+00:00'))
        appointment = Appointment.objects.create(
            patient=patient_profile,
            study=study,
            doctor_name=data.get('doctor_name', ''),
            doctor_specialization=data.get('doctor_specialization', ''),
            appointment_date=appointment_date,
            address=data.get('address', ''),
            reason=data.get('reason', ''),
            notes=data.get('notes', '')
        )
        return JsonResponse({'success': True, 'appointment': {
            'id': appointment.id,
            'patientId': patient_profile.id,
            'appointment_date': appointment.appointment_date.isoformat(),
            'status': appointment.status,
        }})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
    except ResearchStudy.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Study not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_user_studies(request):
    """API endpoint to get user's studies (created for researchers, applied for patients)"""
    try:
        profile = request.user.profile
        
        if profile.role == 'researcher':
            # Get studies created by the researcher
            studies = ResearchStudy.objects.filter(created_by=profile)
            studies_data = []
            
            for study in studies:
                studies_data.append({
                    'id': str(study.id),
                    'title': study.title,
                    'description': study.description,
                    'phase': study.phase,
                    'sponsor': study.sponsor,
                    'location': study.location,
                    'status': study.status,
                    'estimatedEnrollment': study.estimated_enrollment,
                    'currentEnrollment': study.current_enrollment,
                    'startDate': study.start_date.isoformat(),
                    'created_at': study.created_at.isoformat()
                })
            
            return JsonResponse({
                'success': True,
                'studies': studies_data
            })
            
        elif profile.role == 'patient':
            # Get studies the patient has applied to
            participations = StudyParticipation.objects.filter(patient=profile)
            studies_data = []
            
            for participation in participations:
                study = participation.study
                studies_data.append({
                    'id': str(study.id),
                    'title': study.title,
                    'description': study.description,
                    'phase': study.phase,
                    'sponsor': study.sponsor,
                    'location': study.location,
                    'status': study.status,
                    'participationStatus': participation.status,
                    'applied_date': participation.applied_date.isoformat()
                })
            
            return JsonResponse({
                'success': True,
                'studies': studies_data
            })
        
    except Profile.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Profile not found'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500) 

@csrf_exempt
@require_http_methods(["GET"])
def api_debug_users(request):
    """Debug endpoint to check user roles"""
    try:
        users = User.objects.all()
        user_data = []
        for user in users:
            try:
                profile = user.profile
                try:
                    has_patient = PatientProfile.objects.filter(profile=profile).exists()
                except:
                    has_patient = False
                try:
                    has_researcher = ResearcherProfile.objects.filter(profile=profile).exists()
                except:
                    has_researcher = False
                    
                user_data.append({
                    'username': user.username,
                    'email': user.email,
                    'role': profile.role,
                    'has_patient_profile': has_patient,
                    'has_researcher_profile': has_researcher
                })
            except Profile.DoesNotExist:
                user_data.append({
                    'username': user.username,
                    'email': user.email,
                    'role': 'NO_PROFILE',
                    'has_patient_profile': False,
                    'has_researcher_profile': False
                })
        
        return JsonResponse({
            'success': True,
            'users': user_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@require_auth
@require_http_methods(["GET"])
def api_profile(request):
    """API endpoint to get user profile with EHR data"""
    try:
        profile = request.user.profile
        user_data = {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'role': profile.role,
            'profile_picture': request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
            'bio': profile.bio,
            'address': profile.address,
            'emergency_contact': {
                'name': profile.emergency_contact_name,
                'phone': profile.emergency_contact_phone,
                'relationship': profile.emergency_contact_relationship
            }
        }
        
        # Add role-specific data
        if profile.role == 'patient':
            try:
                patient_profile = PatientProfile.objects.get(profile=profile)
                user_data['patient_profile'] = {
                    'date_of_birth': patient_profile.date_of_birth.isoformat(),
                    'gender': patient_profile.gender,
                    'cancer_type': patient_profile.cancer_type,
                    'phone_number': patient_profile.phone_number,
                    'blood_type': patient_profile.blood_type,
                    'height': float(patient_profile.height) if patient_profile.height else None,
                    'weight': float(patient_profile.weight) if patient_profile.weight else None,
                    'bmi': patient_profile.bmi,
                    'allergies': patient_profile.allergies,
                    'medical_conditions': patient_profile.medical_conditions,
                    'family_history': patient_profile.family_history,
                    'insurance_provider': patient_profile.insurance_provider,
                    'insurance_number': patient_profile.insurance_number
                }
            except PatientProfile.DoesNotExist:
                pass
        elif profile.role == 'researcher':
            try:
                researcher_profile = ResearcherProfile.objects.get(profile=profile)
                user_data['researcher_profile'] = {
                    'title': researcher_profile.title,
                    'institution': researcher_profile.institution,
                    'specialization': researcher_profile.specialization,
                    'phone_number': researcher_profile.phone_number,
                    'license_number': researcher_profile.license_number,
                    'years_of_experience': researcher_profile.years_of_experience,
                    'education': researcher_profile.education,
                    'certifications': researcher_profile.certifications
                }
            except ResearcherProfile.DoesNotExist:
                pass

        # Compute profile completion percentage
        try:
            filled = 0
            total = 0

            def is_filled(value):
                if value is None:
                    return False
                if isinstance(value, str):
                    return value.strip() != ''
                return True

            # Top-level fields
            top_level_values = [
                request.user.first_name,
                request.user.last_name,
                user_data.get('bio'),
                user_data.get('address'),
                user_data.get('profile_picture'),
            ]
            for v in top_level_values:
                total += 1
                if is_filled(v):
                    filled += 1

            # Emergency contact
            ec = user_data.get('emergency_contact') or {}
            for k in ['name', 'phone', 'relationship']:
                total += 1
                if is_filled(ec.get(k)):
                    filled += 1

            # Patient-specific fields
            if user_data.get('patient_profile'):
                pp = user_data['patient_profile']
                for k in [
                    'date_of_birth', 'gender', 'cancer_type', 'phone_number', 'blood_type',
                    'height', 'weight', 'bmi', 'allergies', 'medical_conditions',
                    'family_history', 'insurance_provider', 'insurance_number'
                ]:
                    total += 1
                    if is_filled(pp.get(k)):
                        filled += 1

            user_data['profile_completion'] = min(100, round((filled / total) * 100)) if total > 0 else 0
        except Exception:
            user_data['profile_completion'] = 0
        
        return JsonResponse({
            'success': True,
            'profile': user_data
        })
        
    except Profile.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Profile not found'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["PUT"])
def api_update_profile(request):
    """API endpoint to update user profile"""
    try:
        data = json.loads(request.body)
        profile = request.user.profile
        
        # Update basic profile fields
        if 'first_name' in data:
            request.user.first_name = data['first_name']
        if 'last_name' in data:
            request.user.last_name = data['last_name']
        if 'bio' in data:
            profile.bio = data['bio']
        if 'address' in data:
            profile.address = data['address']
        if 'emergency_contact_name' in data:
            profile.emergency_contact_name = data['emergency_contact_name']
        if 'emergency_contact_phone' in data:
            profile.emergency_contact_phone = data['emergency_contact_phone']
        if 'emergency_contact_relationship' in data:
            profile.emergency_contact_relationship = data['emergency_contact_relationship']
        
        request.user.save()
        profile.save()
        
        # Update role-specific profile
        if profile.role == 'patient':
            try:
                patient_profile = PatientProfile.objects.get(profile=profile)
                if 'blood_type' in data:
                    patient_profile.blood_type = data['blood_type']
                if 'height' in data:
                    patient_profile.height = data['height']
                if 'weight' in data:
                    patient_profile.weight = data['weight']
                if 'allergies' in data:
                    patient_profile.allergies = data['allergies']
                if 'medical_conditions' in data:
                    patient_profile.medical_conditions = data['medical_conditions']
                if 'family_history' in data:
                    patient_profile.family_history = data['family_history']
                if 'insurance_provider' in data:
                    patient_profile.insurance_provider = data['insurance_provider']
                if 'insurance_number' in data:
                    patient_profile.insurance_number = data['insurance_number']
                patient_profile.save()
            except PatientProfile.DoesNotExist:
                pass
        elif profile.role == 'researcher':
            try:
                researcher_profile = ResearcherProfile.objects.get(profile=profile)
                if 'license_number' in data:
                    researcher_profile.license_number = data['license_number']
                if 'years_of_experience' in data:
                    researcher_profile.years_of_experience = data['years_of_experience']
                if 'education' in data:
                    researcher_profile.education = data['education']
                if 'certifications' in data:
                    researcher_profile.certifications = data['certifications']
                researcher_profile.save()
            except ResearcherProfile.DoesNotExist:
                pass
        
        return JsonResponse({
            'success': True,
            'message': 'Profile updated successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_upload_profile_picture(request):
    """API endpoint to upload profile picture"""
    try:
        if 'profile_picture' not in request.FILES:
            return JsonResponse({
                'success': False,
                'message': 'No profile picture provided'
            }, status=400)
        
        profile = request.user.profile
        profile.profile_picture = request.FILES['profile_picture']
        profile.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile picture uploaded successfully',
            'profile_picture_url': request.build_absolute_uri(profile.profile_picture.url)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

# EHR API Endpoints
@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_medical_records(request):
    """API endpoint to get user's medical records"""
    try:
        profile = request.user.profile
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can access medical records'
            }, status=403)
        
        records = MedicalRecord.objects.filter(patient=profile)
        records_data = []
        
        for record in records:
            records_data.append({
                'id': record.id,
                'record_type': record.record_type,
                'title': record.title,
                'description': record.description,
                'date': record.date.isoformat(),
                'provider': record.provider,
                'file_url': record.file.url if record.file else None,
                'notes': record.notes,
                'created_at': record.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'medical_records': records_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_create_medical_record(request):
    """API endpoint to create a medical record"""
    try:
        profile = request.user.profile
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can create medical records'
            }, status=403)

        # Support both JSON and multipart form submissions
        is_multipart = request.content_type and request.content_type.startswith('multipart/form-data')
        if is_multipart:
            data_dict = request.POST
        else:
            data_dict = json.loads(request.body)

        # Parse and validate fields with sensible defaults
        record_type = data_dict.get('record_type', 'other')
        title = data_dict.get('title', '').strip() or 'Untitled Record'
        description = data_dict.get('description', '').strip()
        provider = data_dict.get('provider', '').strip() or 'Unknown'
        notes = data_dict.get('notes', '').strip()
        date_str = data_dict.get('date')

        if date_str:
            try:
                record_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({
                    'success': False,
                    'message': 'Invalid date format. Expected YYYY-MM-DD'
                }, status=400)
        else:
            record_date = datetime.utcnow().date()

        record = MedicalRecord.objects.create(
            patient=profile,
            record_type=record_type,
            title=title,
            description=description,
            date=record_date,
            provider=provider,
            notes=notes
        )

        # Handle file upload if provided
        uploaded_file = request.FILES.get('file') if request.FILES else None
        if uploaded_file:
            record.file = uploaded_file
            record.save()

        return JsonResponse({
            'success': True,
            'message': 'Medical record created successfully',
            'record': {
                'id': record.id,
                'title': record.title,
                'record_type': record.record_type,
                'date': record.date.isoformat(),
                'provider': record.provider,
                'file_url': record.file.url if record.file else None
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["DELETE"])
def api_delete_medical_record(request, record_id):
    """API endpoint to delete a medical record"""
    try:
        try:
            profile = request.user.profile
        except Exception:
            return JsonResponse({'success': False, 'message': 'User profile not found'}, status=400)
        
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can delete medical records'
            }, status=403)
        
        record = MedicalRecord.objects.get(id=record_id, patient=profile)
        record.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Medical record deleted successfully'
        })
        
    except MedicalRecord.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Medical record not found or not authorized'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_vital_signs(request):
    """API endpoint to get user's vital signs"""
    try:
        profile = request.user.profile
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can access vital signs'
            }, status=403)
        
        vitals = VitalSigns.objects.filter(patient=profile).order_by('-date')
        vitals_data = []
        
        for vital in vitals:
            vitals_data.append({
                'id': vital.id,
                'date': vital.date.isoformat(),
                'blood_pressure_systolic': vital.blood_pressure_systolic,
                'blood_pressure_diastolic': vital.blood_pressure_diastolic,
                'heart_rate': vital.heart_rate,
                'temperature': float(vital.temperature) if vital.temperature else None,
                'respiratory_rate': vital.respiratory_rate,
                'oxygen_saturation': vital.oxygen_saturation,
                'weight': float(vital.weight) if vital.weight else None,
                'height': float(vital.height) if vital.height else None,
                'bmi': vital.bmi,
                'notes': vital.notes,
                'created_at': vital.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'vital_signs': vitals_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_create_vital_signs(request):
    """API endpoint to create vital signs entry"""
    try:
        profile = request.user.profile
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can create vital signs'
            }, status=403)
        
        data = json.loads(request.body)
        vital_date = datetime.strptime(data.get('date'), '%Y-%m-%dT%H:%M:%S')
        
        vital = VitalSigns.objects.create(
            patient=profile,
            date=vital_date,
            blood_pressure_systolic=data.get('blood_pressure_systolic'),
            blood_pressure_diastolic=data.get('blood_pressure_diastolic'),
            heart_rate=data.get('heart_rate'),
            temperature=data.get('temperature'),
            respiratory_rate=data.get('respiratory_rate'),
            oxygen_saturation=data.get('oxygen_saturation'),
            weight=data.get('weight'),
            height=data.get('height'),
            notes=data.get('notes', ''),
            recorded_by=data.get('recorded_by', '')
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Vital signs recorded successfully',
            'vital_signs': {
                'id': vital.id,
                'date': vital.date.isoformat()
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_medications(request):
    """API endpoint to get user's medications"""
    try:
        profile = request.user.profile
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can access medications'
            }, status=403)
        
        medications = Medication.objects.filter(patient=profile).order_by('-start_date')
        medications_data = []
        
        for medication in medications:
            medications_data.append({
                'id': medication.id,
                'name': medication.name,
                'dosage': medication.dosage,
                'frequency': medication.frequency,
                'start_date': medication.start_date.isoformat(),
                'end_date': medication.end_date.isoformat() if medication.end_date else None,
                'prescribed_by': medication.prescribed_by,
                'status': medication.status,
                'side_effects': medication.side_effects,
                'notes': medication.notes,
                'created_at': medication.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'medications': medications_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_create_medication(request):
    """API endpoint to create a medication entry"""
    try:
        profile = request.user.profile
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can create medications'
            }, status=403)
        
        data = json.loads(request.body)
        start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
        end_date = None
        if data.get('end_date'):
            end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
        
        medication = Medication.objects.create(
            patient=profile,
            name=data.get('name'),
            dosage=data.get('dosage'),
            frequency=data.get('frequency'),
            start_date=start_date,
            end_date=end_date,
            prescribed_by=data.get('prescribed_by'),
            status=data.get('status', 'active'),
            side_effects=data.get('side_effects', ''),
            notes=data.get('notes', '')
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Medication added successfully',
            'medication': {
                'id': medication.id,
                'name': medication.name,
                'status': medication.status
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_immunizations(request):
    """API endpoint to get user's immunizations"""
    try:
        profile = request.user.profile
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can access immunizations'
            }, status=403)
        
        immunizations = Immunization.objects.filter(patient=profile).order_by('-date_administered')
        immunizations_data = []
        
        for immunization in immunizations:
            immunizations_data.append({
                'id': immunization.id,
                'vaccine_name': immunization.vaccine_name,
                'date_administered': immunization.date_administered.isoformat(),
                'next_due_date': immunization.next_due_date.isoformat() if immunization.next_due_date else None,
                'administered_by': immunization.administered_by,
                'lot_number': immunization.lot_number,
                'notes': immunization.notes,
                'created_at': immunization.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'immunizations': immunizations_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_allergies(request):
    """API endpoint to get user's allergies"""
    try:
        profile = request.user.profile
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can access allergies'
            }, status=403)
        
        allergies = Allergy.objects.filter(patient=profile).order_by('-created_at')
        allergies_data = []
        
        for allergy in allergies:
            allergies_data.append({
                'id': allergy.id,
                'allergen': allergy.allergen,
                'severity': allergy.severity,
                'reaction': allergy.reaction,
                'onset_date': allergy.onset_date.isoformat() if allergy.onset_date else None,
                'notes': allergy.notes,
                'created_at': allergy.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'allergies': allergies_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500) 

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_create_community(request):
    """API endpoint to create a new community"""
    try:
        data = json.loads(request.body)
        
        community = Community.objects.create(
            name=data.get('name'),
            description=data.get('description'),
            category=data.get('category', 'General'),
            is_private=data.get('isPrivate', False),
            tags=data.get('tags', []),
            created_by=request.user.profile
        )
        
        # Automatically add the creator as a member
        CommunityMembership.objects.create(
            community=community,
            member=request.user.profile,
            is_moderator=True
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Community created successfully',
            'community': {
                'id': community.id,
                'name': community.name,
                'description': community.description,
                'category': community.category,
                'isPrivate': community.is_private,
                'tags': community.tags,
                'memberCount': community.member_count,
                'lastActivity': community.last_activity.isoformat() if community.last_activity else None,
                'moderators': [request.user.profile.id]
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500) 

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_appointments(request):
    """API endpoint to get user's appointments"""
    try:
        try:
            profile = request.user.profile
        except Exception:
            return JsonResponse({'success': False, 'message': 'User profile not found'}, status=400)
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can access appointments'
            }, status=403)
        
        appointments = Appointment.objects.filter(patient=profile)
        appointments_data = []
        
        for appointment in appointments:
            appointments_data.append({
                'id': appointment.id,
                'doctor_name': appointment.doctor_name,
                'doctor_specialization': appointment.doctor_specialization,
                'appointment_date': appointment.appointment_date.isoformat(),
                'address': appointment.address,
                'reason': appointment.reason,
                'notes': appointment.notes,
                'status': appointment.status,
                'created_at': appointment.created_at.isoformat(),
                'updated_at': appointment.updated_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'appointments': appointments_data
        })
        
    except Profile.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Profile not found'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_create_appointment(request):
    """API endpoint to create a new appointment"""
    try:
        data = json.loads(request.body)
        try:
            profile = request.user.profile
        except Exception:
            return JsonResponse({'success': False, 'message': 'User profile not found'}, status=400)
        
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can create appointments'
            }, status=403)
        
        # Validate required fields
        doctor_name = data.get('doctor_name')
        address = data.get('address')
        reason = data.get('reason')
        raw_dt = data.get('appointment_date')
        if not isinstance(doctor_name, str) or not doctor_name.strip():
            return JsonResponse({'success': False, 'message': 'doctor_name is required'}, status=400)
        if not isinstance(address, str) or not address.strip():
            return JsonResponse({'success': False, 'message': 'address is required'}, status=400)
        if not isinstance(reason, str) or not reason.strip():
            return JsonResponse({'success': False, 'message': 'reason is required'}, status=400)
        if not isinstance(raw_dt, str) or not raw_dt:
            return JsonResponse({'success': False, 'message': 'appointment_date is required'}, status=400)
        try:
            appointment_date = datetime.fromisoformat(raw_dt.replace('Z', '+00:00'))
        except Exception:
            return JsonResponse({'success': False, 'message': 'Invalid appointment_date format'}, status=400)
        
        appointment = Appointment.objects.create(
            patient=profile,
            doctor_name=doctor_name,
            doctor_specialization=data.get('doctor_specialization', '') or '',
            appointment_date=appointment_date,
            address=address,
            reason=reason,
            notes=data.get('notes', '') or ''
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Appointment created successfully',
            'appointment': {
                'id': appointment.id,
                'doctor_name': appointment.doctor_name,
                'doctor_specialization': appointment.doctor_specialization,
                'appointment_date': appointment.appointment_date.isoformat(),
                'address': appointment.address,
                'reason': appointment.reason,
                'notes': appointment.notes,
                'status': appointment.status,
                'created_at': appointment.created_at.isoformat()
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Profile.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Profile not found'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def api_communities(request):
    """API endpoint to get all communities"""
    try:
        communities = Community.objects.all()
        communities_data = []
        
        for community in communities:
            communities_data.append({
                'id': str(community.id),
                'name': community.name,
                'description': community.description,
                'category': community.category,
                'isPrivate': community.is_private,
                'tags': community.tags,
                'memberCount': community.member_count,
                'lastActivity': community.last_activity.isoformat() if community.last_activity else None,
                'moderators': [mod.user.username for mod in community.moderators.all()]
            })
        
        return JsonResponse({
            'success': True,
            'communities': communities_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def api_community_detail(request, community_id):
    """API endpoint to get community details"""
    try:
        community = Community.objects.get(id=community_id)
        
        community_data = {
            'id': str(community.id),
            'name': community.name,
            'description': community.description,
            'category': community.category,
            'isPrivate': community.is_private,
            'tags': community.tags,
            'memberCount': community.member_count,
            'lastActivity': community.last_activity.isoformat() if community.last_activity else None,
            'moderators': [mod.user.username for mod in community.moderators.all()],
            'created_at': community.created_at.isoformat()
        }
        
        return JsonResponse({
            'success': True,
            'community': community_data
        })
        
    except Community.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Community not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def api_studies(request):
    """API endpoint to get all research studies"""
    try:
        studies = ResearchStudy.objects.all()
        studies_data = []
        
        for study in studies:
            studies_data.append({
                'id': str(study.id),
                'title': study.title,
                'description': study.description,
                'phase': study.phase,
                'status': study.status,
                'sponsor': study.sponsor,
                'location': study.location,
                'eligibilityCriteria': study.eligibility_criteria,
                'primaryEndpoint': study.primary_endpoint,
                'estimatedEnrollment': study.estimated_enrollment,
                'currentEnrollment': study.current_enrollment,
                'startDate': study.start_date.isoformat() if study.start_date else None,
                'estimatedCompletionDate': study.estimated_completion_date.isoformat() if study.estimated_completion_date else None,
                'contactInfo': {
                    'name': study.contact_name,
                    'email': study.contact_email,
                    'phone': study.contact_phone,
                },
                'compensation': study.compensation,
                'created_at': study.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'studies': studies_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def api_study_detail(request, study_id):
    """API endpoint to get study details"""
    try:
        study = ResearchStudy.objects.get(id=study_id)
        
        study_data = {
            'id': str(study.id),
            'title': study.title,
            'description': study.description,
            'phase': study.phase,
            'status': study.status,
            'sponsor': study.sponsor,
            'location': study.location,
            'eligibilityCriteria': study.eligibility_criteria,
            'primaryEndpoint': study.primary_endpoint,
            'estimatedEnrollment': study.estimated_enrollment,
            'currentEnrollment': study.current_enrollment,
            'startDate': study.start_date.isoformat() if study.start_date else None,
            'estimatedCompletionDate': study.estimated_completion_date.isoformat() if study.estimated_completion_date else None,
            'contactInfo': {
                'name': study.contact_name,
                'email': study.contact_email,
                'phone': study.contact_phone,
            },
            'compensation': study.compensation,
            'created_at': study.created_at.isoformat()
        }
        
        return JsonResponse({
            'success': True,
            'study': study_data
        })
        
    except ResearchStudy.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Study not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def api_search_patients(request):
    """API endpoint to search for patients"""
    try:
        # Get search parameters
        condition = request.GET.get('condition', '').strip()
        location = request.GET.get('location', '').strip()
        age_range = request.GET.get('ageRange', '').strip()
        gender = request.GET.get('gender', '').strip()
        
        # Start with all patients
        patients = PatientProfile.objects.select_related('profile__user').all()
        
        # Apply filters
        if condition:
            patients = patients.filter(
                Q(cancer_type__icontains=condition) |
                Q(medical_conditions__icontains=condition) |
                Q(allergies__icontains=condition)
            )
        
        if gender:
            patients = patients.filter(gender__iexact=gender)
        
        if age_range:
            try:
                min_age, max_age = map(int, age_range.split('-'))
                today = datetime.now().date()
                min_date = today - timedelta(days=max_age * 365)
                max_date = today - timedelta(days=min_age * 365)
                patients = patients.filter(
                    date_of_birth__gte=min_date,
                    date_of_birth__lte=max_date
                )
            except (ValueError, TypeError):
                pass  # Invalid age range format
        
        # Limit results and create response data
        patients = patients[:20]  # Limit to 20 results
        patients_data = []
        
        for patient in patients:
            # Calculate age
            age = (datetime.now().date() - patient.date_of_birth).days // 365
            
            # Calculate match score based on search criteria
            match_score = 85  # Base score
            if condition and condition.lower() in patient.cancer_type.lower():
                match_score += 10
            if condition and condition.lower() in patient.medical_conditions.lower():
                match_score += 5
            
            patients_data.append({
                'id': patient.profile.user.id,
                'patientId': patient.profile.user.id,
                'age': age,
                'gender': patient.gender,
                'location': 'Location not specified',  # Could be enhanced with actual location
                'condition': patient.cancer_type,
                'stage': 'Stage not specified',  # Could be enhanced with actual stage
                'matchScore': min(match_score, 100),
                'lastActive': datetime.now().isoformat(),
                'medical_conditions': patient.medical_conditions,
                'allergies': patient.allergies
            })
        
        return JsonResponse({
            'success': True,
            'patients': patients_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def api_search_researchers(request):
    """API endpoint to search for researchers"""
    try:
        # Get search parameters
        condition = request.GET.get('condition', '').strip()
        location = request.GET.get('location', '').strip()
        study_phase = request.GET.get('studyPhase', '').strip()
        
        # Start with all researchers
        researchers = ResearcherProfile.objects.select_related('profile__user').all()
        
        # Apply filters
        if condition:
            researchers = researchers.filter(
                Q(specialization__icontains=condition) |
                Q(profile__user__first_name__icontains=condition) |
                Q(profile__user__last_name__icontains=condition)
            )
        
        if location:
            researchers = researchers.filter(
                Q(institution__icontains=location)
            )
        
        if study_phase:
            researchers = researchers.filter(
                Q(specialization__icontains=study_phase)
            )
        
        # Limit results and create response data
        researchers = researchers[:20]  # Limit to 20 results
        researchers_data = []
        
        for researcher in researchers:
            # Calculate match score based on search criteria
            match_score = 90  # Base score
            if condition and condition.lower() in researcher.specialization.lower():
                match_score += 10
            
            researchers_data.append({
                'id': researcher.profile.user.id,
                'researcherId': researcher.profile.user.id,
                'name': f"{researcher.profile.user.first_name} {researcher.profile.user.last_name}",
                'title': researcher.title,
                'institution': researcher.institution,
                'specialization': researcher.specialization,
                'location': researcher.institution,  # Use institution as location
                'matchScore': min(match_score, 100),
                'lastActive': datetime.now().isoformat(),
                'activeStudies': ResearchStudy.objects.filter(researcher=researcher.profile).count()
            })
        
        return JsonResponse({
            'success': True,
            'researchers': researchers_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    """API endpoint for user login"""
    try:
        data = json.loads(request.body)
        username_or_email = data.get('username_or_email', '')
        password = data.get('password', '')
        
        # Try to authenticate with username first, then email
        user = authenticate(username=username_or_email, password=password)
        if user is None:
            # If username failed, try email
            try:
                user_obj = User.objects.get(email=username_or_email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        
        if user is not None and user.is_active:
            login(request, user)
            
            # Get user profile data
            try:
                profile = user.profile
                print(f"DEBUG: User {user.username} profile role: {profile.role}")
                user_data = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': profile.role,
                    'is_authenticated': True
                }
                
                # Add role-specific data
                if profile.role == 'patient':
                    try:
                        patient_profile = PatientProfile.objects.get(profile=profile)
                        user_data['patient_profile'] = {
                            'date_of_birth': patient_profile.date_of_birth.isoformat(),
                            'gender': patient_profile.gender,
                            'cancer_type': patient_profile.cancer_type,
                            'phone_number': patient_profile.phone_number
                        }
                    except PatientProfile.DoesNotExist:
                        pass
                elif profile.role == 'researcher':
                    try:
                        researcher_profile = ResearcherProfile.objects.get(profile=profile)
                        user_data['researcher_profile'] = {
                            'title': researcher_profile.title,
                            'institution': researcher_profile.institution,
                            'specialization': researcher_profile.specialization,
                            'phone_number': researcher_profile.phone_number
                        }
                    except ResearcherProfile.DoesNotExist:
                        pass
                
                return JsonResponse({
                    'success': True,
                    'message': 'Login successful',
                    'user': user_data
                })
            except Profile.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Profile not found'
                }, status=400)
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid username/email or password'
            }, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def api_register_patient(request):
    """API endpoint for patient registration with improved validation and error reporting"""
    try:
        def get_field(*names):
            for name in names:
                if name in data:
                    return data[name]
            return None
        
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'date_of_birth', 'gender', 'cancer_type', 'phone_number']
        for field in required_fields:
            if not get_field(field):
                return JsonResponse({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }, status=400)
        
        # Check if username or email already exists
        if User.objects.filter(username=data['username']).exists():
            return JsonResponse({
                'success': False,
                'message': 'Username already exists'
            }, status=400)
        
        if User.objects.filter(email=data['email']).exists():
            return JsonResponse({
                'success': False,
                'message': 'Email already exists'
            }, status=400)
        
        # Create user
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        
        # Use profile created by signal and set role
        profile = user.profile
        profile.role = 'patient'
        profile.save()
        
        # Create patient profile
        PatientProfile.objects.create(
            profile=profile,
            date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date(),
            gender=data['gender'],
            cancer_type=data['cancer_type'],
            phone_number=data['phone_number']
        )
        
        # Log in the user
        login(request, user)
        
        return JsonResponse({
            'success': True,
            'message': 'Patient registration successful'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def api_register_researcher(request):
    """API endpoint for researcher registration"""
    try:
        def get_field(*names):
            for name in names:
                if name in data:
                    return data[name]
            return None
        
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'title', 'institution', 'specialization', 'phone_number']
        for field in required_fields:
            if not get_field(field):
                return JsonResponse({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }, status=400)
        
        # Check if username or email already exists
        if User.objects.filter(username=data['username']).exists():
            return JsonResponse({
                'success': False,
                'message': 'Username already exists'
            }, status=400)
        
        if User.objects.filter(email=data['email']).exists():
            return JsonResponse({
                'success': False,
                'message': 'Email already exists'
            }, status=400)
        
        # Create user
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        
        # Use profile created by signal and set role
        profile = user.profile
        print(f"DEBUG: Before setting role - profile.role: {profile.role}")
        profile.role = 'researcher'
        profile.save()
        print(f"DEBUG: After setting role - profile.role: {profile.role}")
        
        # Create researcher profile
        ResearcherProfile.objects.create(
            profile=profile,
            title=data['title'],
            institution=data['institution'],
            specialization=data['specialization'],
            phone_number=data['phone_number']
        )
        
        # Log in the user
        login(request, user)
        
        return JsonResponse({
            'success': True,
            'message': 'Researcher registration successful'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def api_logout(request):
    """API endpoint for user logout"""
    logout(request)
    return JsonResponse({
        'success': True,
        'message': 'Logout successful'
    })

@csrf_exempt
@require_http_methods(["GET"])
def api_user_info(request):
    """API endpoint to get current user info"""
    if not request.user.is_authenticated:
        return JsonResponse({
            'success': False,
            'message': 'User not authenticated'
        }, status=401)
    
    try:
        profile = request.user.profile
        user_data = {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'role': profile.role,
            'is_authenticated': True
        }
        
        return JsonResponse({
            'success': True,
            'user': user_data
        })
        
    except Profile.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Profile not found'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500) 

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def api_send_contact_request(request, patient_id):
    """API endpoint to send a contact request to a patient"""
    try:
        data = json.loads(request.body)
        researcher_profile = request.user.profile
        
        if researcher_profile.role != 'researcher':
            return JsonResponse({
                'success': False,
                'message': 'Only researchers can send contact requests'
            }, status=403)
        
        try:
            patient_profile = Profile.objects.get(id=patient_id, role='patient')
        except Profile.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Patient not found'
            }, status=404)
        
        # Check if contact request already exists
        if ContactRequest.objects.filter(researcher=researcher_profile, patient=patient_profile).exists():
            return JsonResponse({
                'success': False,
                'message': 'Contact request already sent to this patient'
            }, status=400)
        
        contact_request = ContactRequest.objects.create(
            researcher=researcher_profile,
            patient=patient_profile,
            message=data.get('message', '')
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Contact request sent successfully',
            'contact_request': {
                'id': contact_request.id,
                'status': contact_request.status,
                'created_at': contact_request.created_at.isoformat()
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["GET"])
def api_contact_requests(request):
    """API endpoint to get user's contact requests"""
    try:
        profile = request.user.profile
        
        if profile.role == 'researcher':
            # Get sent contact requests
            sent_requests = ContactRequest.objects.filter(researcher=profile)
            requests_data = []
            
            for req in sent_requests:
                requests_data.append({
                    'id': req.id,
                    'type': 'sent',
                    'patient_name': f"{req.patient.user.first_name} {req.patient.user.last_name}",
                    'patient_id': req.patient.id,
                    'message': req.message,
                    'status': req.status,
                    'created_at': req.created_at.isoformat()
                })
                
        elif profile.role == 'patient':
            # Get received contact requests
            received_requests = ContactRequest.objects.filter(patient=profile)
            requests_data = []
            
            for req in received_requests:
                requests_data.append({
                    'id': req.id,
                    'type': 'received',
                    'researcher_name': f"{req.researcher.user.first_name} {req.researcher.user.last_name}",
                    'researcher_id': req.researcher.id,
                    'message': req.message,
                    'status': req.status,
                    'created_at': req.created_at.isoformat()
                })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid user role'
            }, status=400)
        
        return JsonResponse({
            'success': True,
            'contact_requests': requests_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_auth
@require_http_methods(["PUT"])
def api_respond_contact_request(request, request_id):
    """API endpoint for patients to respond to contact requests"""
    try:
        data = json.loads(request.body)
        profile = request.user.profile
        
        if profile.role != 'patient':
            return JsonResponse({
                'success': False,
                'message': 'Only patients can respond to contact requests'
            }, status=403)
        
        try:
            contact_request = ContactRequest.objects.get(id=request_id, patient=profile)
        except ContactRequest.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Contact request not found'
            }, status=404)
        
        if contact_request.status != 'pending':
            return JsonResponse({
                'success': False,
                'message': 'Contact request has already been responded to'
            }, status=400)
        
        response = data.get('response')  # 'accept' or 'decline'
        if response not in ['accept', 'decline']:
            return JsonResponse({
                'success': False,
                'message': 'Invalid response. Must be "accept" or "decline"'
            }, status=400)
        
        contact_request.status = 'accepted' if response == 'accept' else 'declined'
        contact_request.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Contact request {response}ed successfully',
            'contact_request': {
                'id': contact_request.id,
                'status': contact_request.status,
                'updated_at': contact_request.updated_at.isoformat()
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500) 