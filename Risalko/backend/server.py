from flask import Flask, Response,request, Blueprint
from bson import json_util, ObjectId
from db import Connection
import validator
from flask_cors import CORS
from utils import generate_unique_code
from datetime import datetime

app = Flask(__name__)

api = Blueprint('api', __name__, url_prefix='/api')
CORS(app)
db = Connection("risalko")

@api.post("/login")
def login():
    data = request.get_json()
    
    if "code" in data:
        is_valid, message = validator.validate_required_fields(data, ["code"])
        
        if not is_valid:
            return Response( json_util.dumps({
                'error': message
            })), 400
        
        code = data.get("code")
        user = db.find_one("users", {"code": code})
        
        if not user:
            return Response( json_util.dumps({
                'error': 'Napačen ključ'
            })), 404
    else:
        is_valid, message = validator.validate_required_fields(data, ["email", "password"])
        
        if not is_valid:
            return Response( json_util.dumps({
                'error': message
            })), 400
        
        email = data.get("email")
        password = data.get("password")
        
        user = db.find_one("users", {"email": email, "password": password})
        
        if not user:
            return Response( json_util.dumps({
                'error': 'Napačna e-pošta ali geslo'
            })), 404
    
    return Response(
        json_util.dumps({"data": user}),
        mimetype='application/json'
    ), 200

@api.post("/register")
def register():
    return create_user()
   
#Users
@api.get("/users")
def get_users():
    populate = request.args.get("populate", False)
    
    if populate:
        pipeline = []
        users = db.lookup_all("users",pipeline)
    else:
        users = db.find_all("users")

    return Response(
        json_util.dumps({"data": list(users)}),
        mimetype='application/json'
    ), 200    

@api.post("/users")
def create_user():    
    data = request.get_json(silent=True)    
    
    if(not data):        
        return Response(json_util.dumps({'error': 'Invalid JSON data'})), 400
        
    is_valid, message = validator.validate_required_fields(data, ["name", "surname", "email", "password"])        

    if not is_valid:
        return Response(json_util.dumps({
            'error': message
        })), 400
    
    user_type = data.get("type", "student")
    
    if user_type not in ["student", "teacher"]:
        return Response(json_util.dumps({
            'error': 'Invalid user type'
        })), 400

    user = {    
        'name': data.get("name"),
        'surname': data.get("surname"),
        'email': data.get("email"),
        'password': data.get("password"),
        'type': user_type,
    }
    
    if user_type == "student":
        code = generate_unique_code(8)

        while db.find_one("users", {"code": code}):
            code = generate_unique_code(8)

        user["code"] = code
        user["paragraphs"] = []        

    db.insert("users", user)    
   
    return Response(
        json_util.dumps({"data": user}),
        mimetype='application/json'
    ), 200

@api.delete("/users/<user_id>")
def delete_user(user_id):
            
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return Response( json_util.dumps({'error': 'Invalid user_id format'})), 400
        
    res = db.delete("users", {'_id': user_object_id})    
    
    if res["type"] == "teacher":
        delete_class(user_id)    
    else:
        refs_res = db.delete_ref_from_array("classes", "students", user_object_id)
        
        if(refs_res is None):
            return Response( json_util.dumps({'error': 'Could not delete refs'})), 400
    
    if res is None:
        return Response( json_util.dumps({'error': 'Could not delete user'})), 400

    return Response(
        json_util.dumps({"data": user_id}),
        mimetype='application/json'
    ), 200

@api.post("/users/<user_id>/paragraphs")
def add_paragraph(user_id):
    data = request.get_json()

    is_valid, message = validator.validate_required_fields(data, ["story_id", "content"])

    if not is_valid:
        return Response( json_util.dumps({
            'error': message
        })), 400

    try:
        user_object_id = ObjectId(user_id)
        story_object_id = ObjectId(data.get("story_id"))
    except Exception:
        return Response( json_util.dumps({'error': 'Invalid id format p'})), 400

    paragraph = {
        'story_id': story_object_id,
        'content': data.get("content"),
        'drawing': data.get("drawing", None),
        'order': data.get("order", 0)
    }

    # insert paragraph document into dedicated collection
    inserted_id = db.insert("paragraphs", paragraph)

    if inserted_id is None:
        return Response(json_util.dumps({'error': 'Could not create paragraph'})), 400

    # attach the new _id back to the paragraph object for response
    paragraph['_id'] = inserted_id

    # push reference to student's paragraphs array
    res = db.update_one("users", {'paragraphs': inserted_id}, {'_id': user_object_id}, append_array=True)

    if res is None:
        # try to clean up inserted paragraph to avoid orphans
        try:
            db.delete("paragraphs", {'_id': inserted_id})
        except Exception:
            pass
        return Response(json_util.dumps({'error': 'Could not assign paragraph to user'})), 400

    return Response(
        json_util.dumps({"data": paragraph}), mimetype='application/json'
    ), 200

@api.patch("/paragraphs/<paragraph_id>")
def update_paragraph(paragraph_id):
    data = request.get_json()

    if not data:
        return Response(json_util.dumps({
            'error': "No data provided"
        })), 400

    try:
        paragraph_object_id = ObjectId(paragraph_id)
    except Exception:
        return Response(json_util.dumps({'error': 'Invalid id format up'}), 400)

    update_fields = {}

    if data.get("story_id") is not None:
        try:
            update_fields['story_id'] = ObjectId(data.get("story_id"))
        except Exception:
            return Response(json_util.dumps({'error': 'Invalid story_id format'}), 400)

    if "drawing" in data:
        update_fields['drawing'] = data.get("drawing")

    if data.get("content") is not None:
        update_fields['content'] = data.get("content")

    if data.get("order") is not None:
        update_fields['order'] = data.get("order")

    if not update_fields:
        return Response(json_util.dumps({'error': 'No fields to update'}), 400)

    res = db.update_one(
        "paragraphs",
        update_fields,
        {'_id': paragraph_object_id},
        append_array=False
    )

    if res is None:
        return Response( json_util.dumps({'error': 'Could not update paragraph'})), 400

    return Response(
        json_util.dumps({"data": res}),
        mimetype='application/json'
    ), 200

@api.get("/paragraphs/<paragraph_id>")
def get_paragraph(paragraph_id):
    try:
        paragraph_object_id = ObjectId(paragraph_id)
    except Exception:
        return Response(json_util.dumps({'error': 'Invalid paragraph_id format'}), 400)

    paragraph = db.find_one("paragraphs", {"_id": paragraph_object_id})

    if not paragraph:
        return Response(json_util.dumps({'error': 'Paragraph not found'}), 404)

    return Response(
        json_util.dumps({"data": paragraph}),
        mimetype='application/json'
    ), 200

@api.get("/stories/<story_id>/paragraphs")
def get_story_paragraphs(story_id):
    try:
        story_object_id = ObjectId(story_id)
    except Exception:
        return Response(json_util.dumps({'error': 'Invalid story_id format'}), 400)

    # Find all paragraphs for this story using MongoDB collection directly
    try:
        collection = db.db["paragraphs"]
        paragraphs = list(collection.find({"story_id": story_object_id}))
        
        # Sort by order
        sorted_paragraphs = sorted(paragraphs, key=lambda p: p.get('order', 0))

        return Response(
            json_util.dumps({"data": sorted_paragraphs}),
            mimetype='application/json'
        ), 200
    except Exception as e:
        print("Error fetching paragraphs:", e)
        return Response(json_util.dumps({'error': 'Could not fetch paragraphs'}), 500)

@api.delete("/paragraphs/<paragraph_id>")
def delete_paragraph(paragraph_id):
    try:
        paragraph_object_id = ObjectId(paragraph_id)
    except Exception:
        return Response(json_util.dumps({'error': 'Invalid paragraph_id format'}), 400)

    refs_res = db.delete_ref_from_array("users", "paragraphs", paragraph_object_id)
    
    res = db.delete("paragraphs", {'_id': paragraph_object_id})

    if res is None:
        return Response(json_util.dumps({'error': 'Could not delete paragraph'}), 400)

    return Response(
        json_util.dumps({"data": paragraph_id}),
        mimetype='application/json'
    ), 200

@api.patch("/users/<user_id>")
def update_user(user_id):
    data = request.get_json()
    
    if not data:
        return Response(json_util.dumps({'error': 'No data provided'}), 400)
    
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return Response(json_util.dumps({'error': 'Invalid user_id format'}), 400)

    update_fields = {}

    if data.get("name") is not None:
        update_fields['name'] = data.get("name")

    if data.get("surname") is not None:
        update_fields['surname'] = data.get("surname")

    if data.get("email") is not None:
        update_fields['email'] = data.get("email")

    if data.get("password") is not None:
        update_fields['password'] = data.get("password")

    if data.get("paragraphs") is not None:
        # Convert paragraph IDs to ObjectIds
        try:
            update_fields['paragraphs'] = [ObjectId(p_id) for p_id in data.get("paragraphs", [])]
        except Exception:
            return Response(json_util.dumps({'error': 'Invalid paragraph_id format in paragraphs array'}), 400)

    if not update_fields:
        return Response(json_util.dumps({'error': 'No fields to update'}), 400)

    res = db.update_one(
        "users",
        update_fields,
        {'_id': user_object_id},
        append_array=False
    )

    if res is None:
        return Response(json_util.dumps({'error': 'Could not update user'}), 400)

    return Response(
        json_util.dumps({"data": res}),
        mimetype='application/json'
    ), 200
    
#Stories  
@api.get("/stories")
def get_stories():
    
    stories = db.find_all("stories")
    return Response(
        json_util.dumps({"data": list(stories)}),
        mimetype='application/json'
    ), 200
    
@api.post("/stories")
def create_story():
    data = request.get_json()
        
    is_valid, message = validator.validate_required_fields(data, ["title", "author", "short_description", "content"])
    
    if not is_valid:
        return Response( json_util.dumps({
            'error': message
        })), 400
            
    story = {
        'title': data.get("title"),
        'author': data.get("author"),
        'short_description': data.get("short_description"),
        'content': data.get('content'),
        'is_finished': False,
    }

    inserted_story = db.insert("stories", story)    
    if inserted_story is None:
        return Response( json_util.dumps({'error': 'Could not create story'})), 400    
           
    return Response(
        json_util.dumps({"data": story}),
        mimetype='application/json'
    ), 200
    
@api.patch("/stories/<story_id>")
def update_story(story_id):
    data = request.get_json()
    
    if not data:
        return Response(json_util.dumps({
            'error': "No data provided"
        }), 400)
    
    update_fields = {}

    if data.get("title") is not None:
        update_fields['title'] = data.get("title")

    if data.get("author") is not None:
        update_fields['author'] = data.get("author")

    if data.get("short_description") is not None:
        update_fields['short_description'] = data.get("short_description")

    if data.get("content") is not None:
        update_fields['content'] = data.get("content")

    if data.get("is_finished") is not None:
        update_fields['is_finished'] = data.get("is_finished")

    if not update_fields:
        return Response(json_util.dumps({'error': 'No fields to update'}), 400)        
           
    try:
        story_object_id = ObjectId(story_id)
    except Exception:
        return Response( json_util.dumps({'error': 'Invalid story_id format'})), 400    

    res = db.update_one(
        "stories",
        update_fields,  
        {'_id': story_object_id},
        append_array=False 
    )
        
    if res is None:
        return Response( json_util.dumps({'error': 'Could not update story'})), 400

    return Response(
        json_util.dumps({"data": res}),
        mimetype='application/json'
    ), 200
    
@api.delete("/stories/<story_id>")
def delete_story(story_id):
    
    try:
        story_object_id = ObjectId(story_id)
    except Exception:
        return Response( json_util.dumps({'error': 'Invalid story_id format'})), 400
        
    res = db.delete("stories", {'_id': story_object_id})    
    
    if res is None:
        return Response( json_util.dumps({'error': 'Could not delete story'})), 400
    
    refs_ref = db.delete_ref_from_array("classes", "stories", story_object_id)

    if refs_ref is None:
        return Response( json_util.dumps({'error': 'Could not delete refs'})), 400

    return Response(
        json_util.dumps({"data": story_id}),
        mimetype='application/json'
    ), 200
    
#Classes
@api.get("/classes")
def get_classes():
    populate = request.args.get("populate", False)
    if populate:
        pipeline = [                
            {"$lookup": {
                        "from": "users",
                        "localField": "students",
                        "foreignField": "_id",
                        "as": "students"
                    }
            },
             {"$lookup": {
                        "from": "users",
                        "localField": "teacher",
                        "foreignField": "_id",
                        "as": "teacher"
                    }
            },
            {"$lookup": {
                        "from": "stories",
                        "localField": "stories",
                        "foreignField": "_id",
                        "as": "stories"
                    }
            }, 
            # populate finalized_stories.story_id by matching to the already-looked-up stories array
            {"$addFields": {
                        "finalized_stories": {
                            "$map": {
                                "input": {"$ifNull": ["$finalized_stories", []]},
                                "as": "fs",
                                "in": {
                                    "story_id": {"$arrayElemAt": [{
                                        "$filter": {
                                            "input": "$stories",
                                            "as": "s",
                                            "cond": {"$eq": ["$$s._id", "$$fs.story_id"]}
                                        }
                                    }, 0]},
                                    "images": "$$fs.images"
                                }
                            }
                        }
                    }
            },
        ] 
        classes = db.lookup_all("classes",pipeline)

    else:
        classes = db.find_all("classes")
      
    return Response(
        json_util.dumps({"data": list(classes)}),
        mimetype='application/json'
    ), 200
    
@api.post("/classes")
def create_class():
    data = request.get_json()
        
    is_valid, message = validator.validate_required_fields(data, ["teacher", "class_name"])
    
    if not is_valid:
        return Response(json_util.dumps({
            'error': message
        })), 400
    
    try:
        finalized_stories_input = data.get("finalized_stories", [])
        finalized_stories = []
        for fd in finalized_stories_input:
            story_id_raw = fd.get("story_id") if isinstance(fd, dict) else None
            images = fd.get("images", []) if isinstance(fd, dict) else []
            if story_id_raw is None:
                continue
            finalized_stories.append({
                "story_id": ObjectId(story_id_raw),
                "images": list(images)
            })

        class_data = {
            'students': [ObjectId(student_id) for student_id in data.get("students", [])],
            'class_name': data.get("class_name"),
            'stories': [ObjectId(story_id) for story_id in data.get("stories", [])],
            'teacher': ObjectId(data.get("teacher")),
            'finalized_stories': finalized_stories,
            'color': data.get("color", "#57E6FF")
        }

        db.insert("classes", class_data)    
    
        return Response(
            json_util.dumps({"data": class_data}),
            mimetype='application/json'
        ), 200
        
    except Exception:
        return Response( json_util.dumps({'error': 'Invalid id format c'})), 400

@api.patch("/classes/<class_id>")
def update_class(class_id):
    data = request.get_json()
    
    if not data:
        return Response(json_util.dumps({
            'error': "No data provided"
        }), 400)
    
    update_fields = {}
    try:
        print(data.get("students", []))
        if data.get("class_name") is not None:
            update_fields['class_name'] = data.get("class_name")

        if data.get("students") is not None:
            update_fields['students'] = [ObjectId(student_id) for student_id in data.get("students", [])]

        if data.get("teacher") is not None:
            update_fields['teacher'] = ObjectId(data.get("teacher"))

        if data.get("stories") is not None:                    
            update_fields['stories'] = [ObjectId(story_id) for story_id in data.get("stories", [])]

        if data.get("finalized_stories") is not None:
            fd_in = data.get("finalized_stories", [])
            fd_out = []
            for fd in fd_in:
                if not isinstance(fd, dict):
                    continue
                sid = fd.get("story_id")
                images = fd.get("images", [])
                if sid is None:
                    continue
                fd_out.append({
                    "story_id": ObjectId(sid),
                    "images": list(images)
                })
            update_fields['finalized_stories'] = fd_out

        if data.get("color") is not None:
            update_fields['color'] = data.get("color")

        if not update_fields:
            return Response(json_util.dumps({'error': 'No fields to update'}), 400)        
           
        class_object_id = ObjectId(class_id)
    except Exception:
        return Response( json_util.dumps({'error': 'Invalid id format uc'})), 400    

    res = db.update_one(
        "classes",
        update_fields,  
        {'_id': class_object_id},
        append_array=False 
    )
        
    if res is None:
        return Response( json_util.dumps({'error': 'Could not update class'})), 400

    return Response(
        json_util.dumps({"data": res}),
        mimetype='application/json'
    ), 200
      
@api.delete("/classes/<class_id>")
def delete_class(class_id):
    
    try:
        class_object_id = ObjectId(class_id)
    except Exception:
        return Response( json_util.dumps({'error': 'Invalid class_id format'})), 400
        
    res = db.delete("classes", {'_id': class_object_id})
    
    if res is None:
        return Response( json_util.dumps({'error': 'Could not delete class'})), 400

    return Response(
        json_util.dumps({"data": class_id}),
        mimetype='application/json'
    ), 200

@api.delete("/classes/<class_id>/students/<student_id>")
def remove_student_from_class(class_id, student_id):
    try:
        class_object_id = ObjectId(class_id)
        student_object_id = ObjectId(student_id)
    except Exception:
        return Response(json_util.dumps({'error': 'Invalid id format'})), 400

    res = db.db["classes"].update_one(
        {'_id': class_object_id},
        {'$pull': {'students': student_object_id}}
    )

    if res.modified_count == 0:
        return Response(json_util.dumps({'error': 'No student removed'})), 400

    return Response(json_util.dumps({'data': True}), mimetype='application/json'), 200



@api.get("/classes/<class_id>")
def get_class(class_id):
    populate = request.args.get("populate", False)

    try:
        class_object_id = ObjectId(class_id)
    except Exception:
        return Response(json_util.dumps({'error': 'Invalid class_id format'})), 400

    if populate:
        pipeline = [
            {"$match": {"_id": class_object_id}},
            {"$lookup": {
                        "from": "users",
                        "localField": "students",
                        "foreignField": "_id",
                        "as": "students"
                    }
            },
            {"$lookup": {
                        "from": "users",
                        "localField": "teacher",
                        "foreignField": "_id",
                        "as": "teacher"
                    }
            },
            {"$lookup": {
                        "from": "stories",
                        "localField": "stories",
                        "foreignField": "_id",
                        "as": "stories"
                    }
            },
            {"$addFields": {
                        "finalized_stories": {"$ifNull": ["$finalized_stories", []]}
                    }
            },
        ]

        classes = db.lookup_all("classes", pipeline)
        if not classes:
            return Response(json_util.dumps({'error': 'Class not found'})), 404

        cls = classes[0]

    else:
        cls = db.find_one("classes", {"_id": class_object_id})

    if not cls:
        return Response(json_util.dumps({'error': 'Class not found'})), 404

    return Response(
        json_util.dumps({"data": cls}),
        mimetype='application/json'
    ), 200


@api.post("/classes/<class_id>/finalized_stories")
def add_finalized_story(class_id):
    data = request.get_json()
    if not data:
        return Response(json_util.dumps({'error': 'No data provided'})), 400

    try:
        class_object_id = ObjectId(class_id)
        story_object_id = ObjectId(data.get('story_id'))
    except Exception:
        return Response(json_util.dumps({'error': 'Invalid id format'})), 400

    images = []
    if data.get('images') is not None:
        images = list(data.get('images', []))
    elif data.get('image') is not None:
        images = [data.get('image')]

    entry = {
        'story_id': story_object_id,
        'images': images
    }

    res = db.update_one('classes', {'finalized_stories': entry}, {'_id': class_object_id}, append_array=True)

    if res is None:
        return Response(json_util.dumps({'error': 'Could not add finalized story entry'})), 400

    return Response(json_util.dumps({'data': entry}), mimetype='application/json'), 200


@api.post("/classes/<class_id>/finalized_stories/<story_id>/images")
def append_finalized_story_image(class_id, story_id):
    data = request.get_json()
    if not data or data.get('image') is None:
        return Response(json_util.dumps({'error': 'No image provided'})), 400

    try:
        class_object_id = ObjectId(class_id)
        story_object_id = ObjectId(story_id)
    except Exception:
        return Response(json_util.dumps({'error': 'Invalid id format'})), 400

    image = data.get('image')

    res = db.update_one('classes', {'finalized_stories.$.images': image}, {'_id': class_object_id, 'finalized_stories.story_id': story_object_id}, append_array=True)

    if res is None:
        return Response(json_util.dumps({'error': 'Could not append image; entry may not exist'})), 400

    return Response(json_util.dumps({'data': True}), mimetype='application/json'), 200
    
@api.post("/classes/<class_id>/finalize-story/<story_id>")
def finalize_story(class_id, story_id):
    """
    Finalize a story by collecting all paragraphs with their data,
    adding to finalized_stories, and removing from stories array.
    """
    try:
        class_object_id = ObjectId(class_id)
        story_object_id = ObjectId(story_id)
    except Exception:
        return Response(json_util.dumps({'error': 'Invalid id format'})), 400

    try:
        collection = db.db['paragraphs']
        paragraphs = list(collection.find({"story_id": story_object_id}).sort("order", 1))

        if not paragraphs:
            return Response(json_util.dumps({'error': 'No paragraphs found for this story'})), 404

        story = db.find_one("stories", {"_id": story_object_id})
        if not story:
            return Response(json_util.dumps({'error': 'Story not found'})), 404

        paragraphs_data = []
        for paragraph in paragraphs:
            paragraphs_data.append({
                'paragraph_id': paragraph.get('_id'),
                'content': paragraph.get('content', ''),
                'drawing': paragraph.get('drawing'),
                'order': paragraph.get('order', 0)
            })

        entry = {
            'story_id': story_object_id,
            'paragraphs': paragraphs_data,
            'story': {
                'title': story.get('title', ''),
                'short_description': story.get('short_description', ''),
                'author': story.get('author', '')
            }
        }

        res_add = db.update_one(
            'classes',
            {'finalized_stories': entry},
            {'_id': class_object_id},
            append_array=True
        )

        if res_add is None:
            return Response(json_util.dumps({'error': 'Could not add finalized story'})), 400

        db.delete_ref_from_array('classes', 'stories', story_object_id)

        return Response(
            json_util.dumps({'data': {
                'message': 'Story finalized successfully',
                'paragraphs_count': len(paragraphs_data),
                'entry': entry
            }}),
            mimetype='application/json'
        ), 200
    except Exception as e:
        print("Error finalizing story:", e)
        return Response(json_util.dumps({'error': 'Could not finalize story'})), 400

if __name__=="__main__":
    app.register_blueprint(api)
    app.run(debug=True)