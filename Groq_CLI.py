#!/usr/bin/env python3
"""
Groq CLI for RAG-based question answering
Uses Groq LLM with document embeddings for intelligent responses
"""

import argparse
import os
import sys
from pathlib import Path
from typing import List, Optional

# Import from langchain packages
try:
    from langchain_community.vectorstores import FAISS
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_groq import ChatGroq
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.prompts import PromptTemplate
    from langchain.schema import Document
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain.chains import create_retrieval_chain
    print("Using langchain imports")
except ImportError as e:
    print(f"Error: Required LangChain packages not found. Please install them:")
    print(f"pip install langchain langchain-community langchain-groq sentence-transformers faiss-cpu")
    print(f"Original error: {e}")
    sys.exit(1)

def load_documents(directory: str) -> List[str]:
    """Load documents from directory and return as list of texts"""
    documents = []
    
    if not os.path.exists(directory):
        print(f"Error: Directory '{directory}' not found")
        return documents
    
    # Handle single file
    if os.path.isfile(directory):
        try:
            with open(directory, 'r', encoding='utf-8') as f:
                content = f.read()
                documents.append(content)
                print(f"Loaded single file: {directory}")
        except Exception as e:
            print(f"Error reading file {directory}: {e}")
        return documents
    
    # Handle directory
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.txt', '.md', '.py', '.js', '.html', '.css')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        documents.append(content)
                        print(f"Loaded: {file}")
                except Exception as e:
                    print(f"Error reading {file}: {e}")
    
    return documents

def create_embeddings(documents: List[str]) -> FAISS:
    """Create embeddings and vector store from documents"""
    if not documents:
        print("No documents to process")
        return None
    
    print("Creating text chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    
    chunks = text_splitter.split_documents([Document(page_content=doc, metadata={}) for doc in documents])
    print(f"Created {len(chunks)} text chunks")
    
    print("Loading embeddings model...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )
    
    print("Creating vector store...")
    vectorstore = FAISS.from_documents(chunks, embeddings)
    
    return vectorstore

def ask_question(vectorstore: FAISS, question: str, groq_api_key: str) -> str:
    """Ask a question and get answer using Groq LLM"""
    if not vectorstore:
        return "Error: No vector store available"

    print("Searching for relevant information...")
    docs = vectorstore.similarity_search(question, k=4)

    print("Generating answer with Groq...")
    llm = ChatGroq(
        groq_api_key=groq_api_key,
        model_name="llama3-8b-8192",
        temperature=0.1,
        max_tokens=2048
    )

    # Create a custom prompt template
    prompt_template = """Use the following context to answer the question at the end.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.

    Context:
    {context}

    Question: {input}

    Answer:"""

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "input"]
    )

    # Create document chain
    document_chain = create_stuff_documents_chain(llm, prompt)

    # Create retriever from vectorstore
    retriever = vectorstore.as_retriever()

    # Create retrieval chain
    retrieval_chain = create_retrieval_chain(retriever, document_chain)

    # Get answer
    result = retrieval_chain.invoke({"input": question})

    return result["answer"]

def main():
    parser = argparse.ArgumentParser(description="Groq CLI for RAG-based question answering")
    parser.add_argument("--api-key", required=True, help="Groq API key")
    parser.add_argument("--directory", required=True, help="Directory or file containing documents")
    parser.add_argument("--question", required=True, help="Question to ask")
    parser.add_argument("--no-citations", action="store_true", help="Disable citations in output")
    parser.add_argument("--no-themes", action="store_true", help="Disable theme analysis in output")
    
    args = parser.parse_args()
    
    # Validate API key
    if not args.api_key or args.api_key == "your_groq_api_key_here":
        print("Error: Please provide a valid Groq API key")
        sys.exit(1)
    
    print("Initializing Markdown Chatbot...")
    
    try:
        # Load documents
        documents = load_documents(args.directory)
        if not documents:
            print("No documents found to process")
            sys.exit(1)
        
        print(f"Loaded {len(documents)} document(s)")
        
        # Create embeddings
        vectorstore = create_embeddings(documents)
        if not vectorstore:
            print("Failed to create embeddings")
            sys.exit(1)
        
        # Ask question
        answer = ask_question(vectorstore, args.question, args.api_key)
        
        # Format output
        print("\n" + "="*50)
        print("ANSWER")
        print("="*50)
        print(answer)
        
        if not args.no_citations:
            print("\n" + "="*50)
            print("CITATIONS")
            print("="*50)
            print("Based on the following document sections:")
            for i, doc in enumerate(documents[:3]):
                print(f"\nDocument {i+1}:")
                print(doc[:200] + "..." if len(doc) > 200 else doc)
        
        if not args.no_themes:
            print("\n" + "="*50)
            print("RECURRING THEMES")
            print("="*50)
            print("Key themes identified in the documents:")
            # Simple theme extraction (you can enhance this)
            all_text = " ".join(documents).lower()
            themes = []
            if "learning" in all_text or "education" in all_text:
                themes.append("Learning and Education")
            if "technology" in all_text or "software" in all_text:
                themes.append("Technology and Software")
            if "science" in all_text or "research" in all_text:
                themes.append("Science and Research")
            if "business" in all_text or "management" in all_text:
                themes.append("Business and Management")
            
            if themes:
                for theme in themes:
                    print(f"- {theme}")
            else:
                print("General content")
        
        print("\n" + "="*50)
        print("Processing complete!")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
